-- Core Shield Anti-Cheat — canlı özellikler modülü
-- Konum/can/kalkan aktarımı, bypass (whitelist), kara liste (blacklist),
-- yönetici listesi + izinler, ekran görüntüsü ve oyun içi yönetici aksiyonları.

local PosBuffer = {}       -- license -> son konum verisi
local Whitelist = {}       -- { kind, value }
local Blacklist = {}       -- { kind, model, action }
local Admins = {}          -- identifier -> { name, role, permissions = { perm = true } }

-- ---------------------------------------------------------------------------
-- Bypass (whitelist)
-- ---------------------------------------------------------------------------
local function refreshWhitelist()
  Aeigs.request('/whitelist', 'GET', nil, function(ok, data)
    if ok and data and data.whitelist then Whitelist = data.whitelist end
  end)
end

--- Oyuncunun herhangi bir kimliği bypass listesindeyse true.
function Aeigs.isWhitelisted(src)
  local ids = Aeigs.getIdents(src)
  for _, w in ipairs(Whitelist) do
    if (w.kind == 'license' and w.value == ids.license)
      or (w.kind == 'discord' and w.value == ids.discord)
      or (w.kind == 'steam' and w.value == ids.steam)
      or (w.kind == 'ip' and w.value == ids.ip) then
      return true
    end
  end
  return false
end

-- ---------------------------------------------------------------------------
-- Kara liste (blacklist) — client'lara iletilir, orada uygulanır
-- ---------------------------------------------------------------------------
local BlacklistByHash = {}  -- modelHash -> { kind, model, action }
local WeaponList = {}       -- client'a gönderilecek yasaklı silahlar { hash, action }
local function refreshBlacklist()
  Aeigs.request('/blacklist', 'GET', nil, function(ok, data)
    if ok and data and data.blacklist then
      Blacklist = data.blacklist
      local byHash, weapons = {}, {}
      for _, b in ipairs(Blacklist) do
        -- model bir isim ("adder") ya da sayısal hash olabilir
        local h = tonumber(b.model) or GetHashKey(b.model)
        byHash[h] = b
        if b.kind == 'weapon' then weapons[#weapons + 1] = { hash = h, action = b.action } end
      end
      BlacklistByHash = byHash
      WeaponList = weapons
      TriggerClientEvent('aeigs:weaponBlacklist', -1, WeaponList)
    end
  end)
end

-- Yeni bağlanan client yasaklı silah listesini ister
RegisterNetEvent('aeigs:requestWeaponBlacklist', function()
  TriggerClientEvent('aeigs:weaponBlacklist', source, WeaponList)
end)

-- Client, envanterinde yasaklı silah tespit etti (ateş etmeden, KICK/BAN için)
RegisterNetEvent('aeigs:weaponHit', function(hash)
  local src = source
  local entry = BlacklistByHash[hash]
  if entry and entry.kind == 'weapon' then
    Aeigs.enforceBlacklist(src, entry, hash)
  end
end)

--- Bir entity model hash'i kara listedeyse kaydını döndürür.
function Aeigs.blacklistLookup(modelHash)
  return BlacklistByHash[modelHash]
end

--- Kara liste ihlalini uygular (protection.lua entityCreating içinden çağrılır).
function Aeigs.enforceBlacklist(owner, entry, model)
  if not owner or owner <= 0 then return end
  if Aeigs.isWhitelisted(owner) then return end
  local ids = Aeigs.getIdents(owner)
  local pname = GetPlayerName(owner) or ('Player#' .. owner)
  Aeigs.log('DETECTION', 'blacklist', ('Kara liste: %s "%s" — %s'):format(entry.kind, entry.model, pname))
  Aeigs.request('/detections', 'POST', {
    type = 'BLACKLIST_' .. string.upper(entry.kind),
    severity = (entry.action == 'BAN') and 'CRITICAL' or 'HIGH',
    playerName = pname,
    license = ids.license,
    details = { model = entry.model, action = entry.action },
  }, nil)
  if entry.action == 'KICK' then
    DropPlayer(owner, ('[Core Shield] Yasaklı %s kullanımı: %s'):format(entry.kind, entry.model))
  elseif entry.action == 'BAN' then
    Aeigs.request('/ingame-action', 'POST', {
      type = 'BAN', reason = ('Kara liste: %s (%s)'):format(entry.model, entry.kind),
      by = 'AntiCheat', license = ids.license, playerName = pname,
    }, function(ok, data)
      if Aeigs.refreshBans then Aeigs.refreshBans() end
      local code = (ok and data and data.banCode) or '—'
      DropPlayer(owner, ('[Core Shield] Yasaklandınız | Yasaklı %s: %s | Ban Kodu: %s')
        :format(entry.kind, entry.model, code))
    end)
  end
end

-- ---------------------------------------------------------------------------
-- Canlı konum / can / kalkan — client gönderir, toplu API'ye aktarılır
-- ---------------------------------------------------------------------------
RegisterNetEvent('aeigs:pos', function(d)
  local src = source
  if Aeigs.eventLimited(src, 'pos', 10, 2000) then return end
  local ids = Aeigs.getIdents(src)
  if not ids.license then return end
  if type(d) ~= 'table' then return end
  PosBuffer[ids.license] = {
    license = ids.license,
    x = d.x or 0.0, y = d.y or 0.0, z = d.z or 0.0,
    heading = d.heading, health = d.health, armor = d.armor,
    activity = d.activity, ping = GetPlayerPing(src),
  }
end)

-- Hafif "çarpışma kapalı mı" sinyali (~800ms, client/main.lua). TELEPORT
-- taramasının NoClip'le karışmaması (yanlış sebep) için kullanılır.
local CollState = {}  -- src -> { on, t }
RegisterNetEvent('aeigs:collState', function(collisionOff)
  if Aeigs.eventLimited(source, 'collState', 15, 2000) then return end
  CollState[source] = { on = collisionOff == true, t = GetGameTimer() }
end)
local function recentlyNoclip(src, withinMs)
  local c = CollState[src]
  return c ~= nil and c.on and (GetGameTimer() - c.t) < (withinMs or 4000)
end

local function flushPositions()
  local list = {}
  for _, v in pairs(PosBuffer) do list[#list + 1] = v end
  PosBuffer = {}
  if #list > 0 then
    Aeigs.request('/positions', 'POST', { players = list }, nil)
  end
end

-- ---------------------------------------------------------------------------
-- Yönetici listesi + izinler (oyun içi menü)
-- ---------------------------------------------------------------------------
local function refreshAdmins()
  Aeigs.request('/admins', 'GET', nil, function(ok, data)
    if not ok or not data or not data.admins then return end
    local map = {}
    for _, a in ipairs(data.admins) do
      local perms = {}
      for _, p in ipairs(a.permissions or {}) do perms[p] = true end
      map[a.identifier] = { name = a.name, role = a.role, permissions = perms }
    end
    Admins = map
    -- Her çevrimiçi oyuncuya kendi izinlerini gönder (menü buna göre açılır)
    for _, src in ipairs(GetPlayers()) do
      TriggerClientEvent('aeigs:perms', src, Aeigs.permsOf(tonumber(src)))
    end
  end)
end

--- Bir oyuncunun yönetici kaydını döndürür (identifier eşleşmesi).
function Aeigs.adminOf(src)
  local ids = Aeigs.getIdents(src)
  return Admins[ids.discord] or Admins[ids.license] or Admins[ids.steam]
end

function Aeigs.permsOf(src)
  local a = Aeigs.adminOf(src)
  if not a then return {} end
  local out = {}
  for k in pairs(a.permissions) do out[#out + 1] = k end
  return out
end

function Aeigs.hasPerm(src, perm)
  local a = Aeigs.adminOf(src)
  return a ~= nil and a.permissions[perm] == true
end

-- Client menüsü açılırken izinleri ister
RegisterNetEvent('aeigs:requestPerms', function()
  TriggerClientEvent('aeigs:perms', source, Aeigs.permsOf(source))
end)

-- ---------------------------------------------------------------------------
-- Oyun içi yönetici aksiyonları — client menüsünden gelir, izin doğrulanır
-- ---------------------------------------------------------------------------
local function nameOf(src) return GetPlayerName(src) or ('Player#' .. src) end

RegisterNetEvent('aeigs:adminAction', function(action, targetId, arg)
  local src = source
  if not Aeigs.hasPerm(src, action) then
    TriggerClientEvent('aeigs:notify', src, '~r~Bu işlem için izniniz yok: ' .. tostring(action))
    return
  end
  local target = targetId and GetPlayerName(tonumber(targetId)) and tonumber(targetId) or nil
  local adminName = nameOf(src)

  if action == 'kick' and target then
    Aeigs.request('/ingame-action', 'POST', {
      type = 'KICK', reason = arg or 'Yönetici', by = adminName,
      license = Aeigs.getIdents(target).license, playerName = nameOf(target),
    }, nil)
    DropPlayer(target, ('[Core Shield] Kicklendiniz | %s'):format(arg or 'Yönetici'))
  elseif action == 'ban' and target then
    local tids = Aeigs.getIdents(target)
    Aeigs.request('/ingame-action', 'POST', {
      type = 'BAN', reason = arg or 'Yönetici', by = adminName,
      license = tids.license, playerName = nameOf(target),
    }, function(ok, data)
      if Aeigs.refreshBans then Aeigs.refreshBans() end
      local code = (ok and data and data.banCode) or '—'
      DropPlayer(target, ('[Core Shield] Yasaklandınız | %s | Ban Kodu: %s'):format(arg or 'Yönetici', code))
    end)
  elseif action == 'warn' and target then
    Aeigs.request('/ingame-action', 'POST', {
      type = 'WARN', reason = arg or 'Yönetici', by = adminName,
      license = Aeigs.getIdents(target).license, playerName = nameOf(target),
    }, nil)
    TriggerClientEvent('aeigs:notify', target, '~y~Uyarı: ' .. (arg or ''))
  elseif action == 'revive' and target then
    Aeigs.grantRevive(target)
    TriggerClientEvent('aeigs:revive', target)
  elseif action == 'freeze' and target then
    TriggerClientEvent('aeigs:freeze', target, arg == 'on')
  elseif action == 'tp' and target then
    -- yöneticiyi hedefe ışınla (yetkili → teleport tespitinden muaf)
    local ped = GetPlayerPed(target)
    local c = GetEntityCoords(ped)
    Aeigs.grantTp(src)
    TriggerClientEvent('aeigs:teleport', src, c.x, c.y, c.z)
  elseif action == 'bring' and target then
    local ped = GetPlayerPed(src)
    local c = GetEntityCoords(ped)
    Aeigs.grantTp(target)
    TriggerClientEvent('aeigs:teleport', target, c.x, c.y, c.z)
  elseif action == 'spectate' and target then
    local ped = GetPlayerPed(target)
    local c = GetEntityCoords(ped)
    Aeigs.grantTp(src)
    TriggerClientEvent('aeigs:spectate', src, targetId, c.x, c.y, c.z)
  elseif action == 'announce' then
    TriggerClientEvent('aeigs:notify', -1, '~b~[Duyuru] ~w~' .. tostring(arg or ''))
  elseif action == 'screenshot' and target then
    if Config.ScreenshotUploadUrl ~= '' then
      TriggerClientEvent('aeigs:screenshot', target, Config.ScreenshotUploadUrl, nil, src)
    else
      TriggerClientEvent('aeigs:notify', src, '~r~Ekran görüntüsü için aeigs_ss_upload ayarlı değil')
    end
  end
  Aeigs.log('INFO', 'admin', ('%s -> %s%s'):format(adminName, action, target and (' #' .. target) or ''))
end)

-- ---------------------------------------------------------------------------
-- Ekran görüntüsü istekleri (panelden) — poll et, hedefe tetikle
-- Yükleme hedefi: özel host ayarlanmadıysa panelin dahili ucu kullanılır.
-- ---------------------------------------------------------------------------
local function ssUploadBase()
  if Config.ScreenshotUploadUrl and Config.ScreenshotUploadUrl ~= '' then
    return Config.ScreenshotUploadUrl
  end
  return (Config.ApiBase or '') .. '/screenshot/upload'
end
-- Diğer server modülleri (main.lua, protection.lua) ban anındaki ekran
-- görüntüsü serisini tetiklerken aynı yükleme adresini kullanmalı.
Aeigs.screenshotUploadBase = ssUploadBase

local function pollScreenshots()
  Aeigs.request('/screenshot/pending', 'GET', nil, function(ok, data)
    if not ok or not data or not data.requests then return end
    for _, r in ipairs(data.requests) do
      local target = Aeigs.findByLicense(r.playerLicense)
      if target then
        local url = ssUploadBase() .. '?rid=' .. r.id
        TriggerClientEvent('aeigs:screenshot', target, url, r.id, nil)
      else
        Aeigs.request('/screenshot/result', 'POST', { id = r.id, failed = true }, nil)
      end
    end
  end)
end

-- Client görüntüyü aldı → URL'i panele geri gönder
RegisterNetEvent('aeigs:screenshotResult', function(reqId, url, adminId)
  if adminId then
    -- oyun içi yöneticinin isteği: URL'i ona bildir
    TriggerClientEvent('aeigs:notify', tonumber(adminId), '~g~Ekran görüntüsü: ' .. tostring(url))
    return
  end
  if reqId then
    Aeigs.request('/screenshot/result', 'POST', { id = reqId, url = url }, nil)
  end
end)

-- ---------------------------------------------------------------------------
-- SUNUCU TARAFLI TELEPORT TESPİTİ (kandırılamaz) — NoClip/multichar/respawn'dan
-- AYRIŞTIRILMIŞ. Sunucu oyuncunun koordinatını doğrudan okur; iki örnek
-- arasında yaya >60 m/s, araç >250 m/s = fiziksel olarak imkânsız = teleport.
--
-- ÜÇ MUAFİYET/AYRIŞTIRMA (false ban'ların asıl kaynağıydı):
--   1) "Yeni giriş" muafiyeti (playerJoining) — ilk yükleme.
--   2) "Ped değişti" muafiyeti (aeigs:respawnAnchor, client/core.lua) —
--      MULTICHAR karakter seçimi / ölüp-dirilme / framework respawn'ı ne
--      zaman olursa olsun konum çapası SIFIRLANIR, eski konumla kıyaslanmaz.
--      → "oyuna girer girmez / karakter seçince teleport banı" biter.
--   3) NoClip ayrışması — sıçrama anında oyuncunun çarpışması kapalıysa
--      (aeigs:collState) bu TELEPORT değil NOCLIP'tir; doğru sebeple ve
--      kendi (client) NoClip tespitine bırakılır — sunucu sadece o an
--      hiç tetiklenmemişse yedek/geç bir NOCLIP raporu düşürür, TELEPORT
--      ATMAZ. → "noclip açan teleporttan yanlış sebeple banlanıyor" biter.
-- ---------------------------------------------------------------------------
local sPos = {}          -- src -> { x,y,z, t, seen }
local tpGrace = {}       -- src -> muafiyet bitiş ms (yetkili ışınlama/yeni giriş/respawn)
local noclipFallbackStrike = {}  -- src -> strike sayacı (NoClip yedek raporu)

function Aeigs.grantTp(src)
  tpGrace[tonumber(src)] = GetGameTimer() + 8000
end

-- Sunucu taraflı revive muafiyeti (vehicle_guard.lua'nın armor-regen kontrolü
-- kullanır — gerçek reviveyi armor artışıyla karıştırmasın diye).
local reviveGrace = {}
function Aeigs.grantRevive(src)
  reviveGrace[tonumber(src)] = GetGameTimer() + 8000
end
function Aeigs.hasReviveGrace(src)
  local until_ = reviveGrace[tonumber(src)]
  return until_ ~= nil and GetGameTimer() < until_
end

--- Client'ta ped handle'ı değişti (multichar/respawn/ölüp-dirilme). Konum
--- çapasını sıfırla ki eski konumla kıyaslanıp TELEPORT atılmasın.
RegisterNetEvent('aeigs:respawnAnchor', function()
  local src = source
  if Aeigs.eventLimited(src, 'respawnAnchor', 10, 5000) then return end
  sPos[src] = nil
  Aeigs.grantTp(src)
end)

local function teleportScan()
  local now = GetGameTimer()
  for _, sid in ipairs(GetPlayers()) do
    local src = tonumber(sid)
    local ped = GetPlayerPed(src)
    if ped and ped ~= 0 then
      local c = GetEntityCoords(ped)
      if c and not (c.x == 0.0 and c.y == 0.0 and c.z == 0.0) then
        -- Harita dışı / geçersiz derinlik: GTA V haritası kabaca
        -- -4000..8000 (x/y) ve -300..1200 (z) sınırları içindedir. Bunun
        -- ÇOK dışında (ör. Z -1000) olmak yalnızca "haritanın altına
        -- ışınlanma" hileleriyle mümkündür (dünya kaçışı / obje içine
        -- saklanma). Cömert sınırlar → gerçek oyun ASLA false vermez.
        if (Aeigs.getRules()['anti_out_of_bounds'] == true)
            and (c.z < -300.0 or c.z > 1500.0 or c.x < -6000.0 or c.x > 10000.0 or c.y < -6000.0 or c.y > 10000.0)
            and not (Aeigs.isWhitelisted and Aeigs.isWhitelisted(src)) then
          TriggerEvent('aeigs:serverReport', src, 'OUT_OF_BOUNDS', 'CRITICAL', { x = math.floor(c.x), y = math.floor(c.y), z = math.floor(c.z) })
        end
        -- Zırh > 100 fiziksel olarak İMKANSIZDIR → kesin armor hack (yanlış-pozitif yok)
        if (now - (sPos[src] and sPos[src].seen or now)) > 5000
            and GetPedArmour(ped) > 100
            and not (Aeigs.isWhitelisted and Aeigs.isWhitelisted(src)) then
          TriggerEvent('aeigs:serverReport', src, 'ARMOR_HACK', 'CRITICAL', { armor = GetPedArmour(ped) })
        end
        local prev = sPos[src]
        if not prev then
          sPos[src] = { x = c.x, y = c.y, z = c.z, t = now, seen = now }
        else
          local dt = (now - prev.t) / 1000.0
          local dist = #(c - vector3(prev.x, prev.y, prev.z))
          local settled = (now - prev.seen) > 20000        -- girişten/respawn'dan 20 sn sonra
          local granted = tpGrace[src] and now < tpGrace[src]
          local inVeh = GetVehiclePedIsIn(ped, false) ~= 0
          local perSec = dt > 0 and (dist / dt) or 0
          local limit = inVeh and 250.0 or 60.0
          if settled and not granted and dist > 40.0 and perSec > limit
              and not (Aeigs.isWhitelisted and Aeigs.isWhitelisted(src)) then
            if recentlyNoclip(src) then
              -- Bu bir sıçrama değil NoClip uçuşu — TELEPORT atma. Client'ın
              -- kendi NoClip tespiti zaten ~2 sn içinde doğru sebeple banlar;
              -- o çalışmadıysa (devre dışı bırakılmış olabilir) yedek olarak
              -- birkaç kez üst üste görülünce sunucu NOCLIP diye raporlar.
              noclipFallbackStrike[src] = (noclipFallbackStrike[src] or 0) + 1
              if noclipFallbackStrike[src] >= 3 then
                noclipFallbackStrike[src] = 0
                TriggerEvent('aeigs:serverReport', src, 'NOCLIP', 'CRITICAL', { source = 'server_fallback' })
              end
            else
              TriggerEvent('aeigs:serverReport', src, 'TELEPORT', 'CRITICAL', { distance = math.floor(dist) })
            end
            sPos[src].seen = now + 5000  -- kısa süre tekrar tetiklenmesin
          end
          prev.x, prev.y, prev.z, prev.t = c.x, c.y, c.z, now
        end
      end
    end
  end
  -- ayrılanları temizle
  local online = {}
  for _, sid in ipairs(GetPlayers()) do online[tonumber(sid)] = true end
  for k in pairs(sPos) do
    if not online[k] then
      sPos[k] = nil; tpGrace[k] = nil; noclipFallbackStrike[k] = nil; CollState[k] = nil
    end
  end
end

AddEventHandler('playerJoining', function()
  Aeigs.grantTp(source)  -- yeni girişte ilk ışınlanma/yükleme muaf
end)

-- ---------------------------------------------------------------------------
-- Döngüler
-- ---------------------------------------------------------------------------
CreateThread(function()
  if not Config.Token or Config.Token == '' then return end
  Wait(2000)
  refreshWhitelist()
  refreshBlacklist()
  refreshAdmins()

  local function loop(interval, fn)
    CreateThread(function()
      while true do Wait(interval * 1000); pcall(fn) end
    end)
  end

  loop(Config.PositionInterval, flushPositions)
  loop(Config.WhitelistInterval, refreshWhitelist)
  loop(Config.BlacklistInterval, refreshBlacklist)
  loop(Config.AdminInterval, refreshAdmins)
  loop(Config.ScreenshotInterval, pollScreenshots)

  -- Teleport taraması ~1 sn (hassas ama ucuz)
  CreateThread(function()
    while true do Wait(1000); pcall(teleportScan) end
  end)
end)
