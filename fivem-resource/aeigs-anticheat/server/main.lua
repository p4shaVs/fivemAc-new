-- Core Shield Anti-Cheat — sunucu ana betiği
-- Panelle konuşur: heartbeat, oyuncu senkronizasyonu, ban kontrolü,
-- ceza/komut/kaynak kuyruğu tüketimi, log gönderimi.

local ServerConfig = {}         -- heartbeat'ten dönen ayarlar (rules)
local BanList = {}              -- aktif ban listesi (cache)
local LogBuffer = {}            -- gönderilmeyi bekleyen loglar

-- ---------------------------------------------------------------------------
-- Yardımcılar
-- ---------------------------------------------------------------------------

local function getIdents(src)
  local t = { license = nil, steam = nil, discord = nil, ip = nil }
  for _, id in ipairs(GetPlayerIdentifiers(src)) do
    if id:sub(1, 8) == 'license:' and not t.license then
      t.license = id
    elseif id:sub(1, 6) == 'steam:' then
      t.steam = id
    elseif id:sub(1, 8) == 'discord:' then
      t.discord = id
    elseif id:sub(1, 3) == 'ip:' then
      t.ip = id:sub(4)
    end
  end
  if not t.ip then t.ip = GetPlayerEndpoint(src) end
  return t
end

local function findByLicense(license)
  if not license then return nil end
  for _, src in ipairs(GetPlayers()) do
    if getIdents(src).license == license then return src end
  end
  return nil
end

function Aeigs.log(level, source, message)
  LogBuffer[#LogBuffer + 1] = { level = level or 'INFO', source = source or 'server', message = tostring(message) }
end

function Aeigs.getRules()
  return ServerConfig.rules or {}
end

-- ---------------------------------------------------------------------------
-- Kendi network event'lerimiz için oran sınırlayıcı (sertleştirme).
-- Amaç: bir hilecinin aeigs:report/aeigs:aim/aeigs:pos gibi event'lerimizi
-- spam edip anti-cheat'in kendisini (ve panel API'sini) yorması/DoS etmesini
-- önlemek. Aşan istekler sessizce (hata basmadan) atlanır.
-- ---------------------------------------------------------------------------
local eventBuckets = {}
function Aeigs.eventLimited(src, name, limit, windowMs)
  local key = tostring(src) .. ':' .. name
  local now = GetGameTimer()
  local b = eventBuckets[key]
  if not b or now > b.reset then
    eventBuckets[key] = { count = 1, reset = now + windowMs }
    return false
  end
  b.count = b.count + 1
  return b.count > limit
end
AddEventHandler('playerDropped', function()
  local s = tostring(source)
  for k in pairs(eventBuckets) do
    if k:sub(1, #s + 1) == s .. ':' then eventBuckets[k] = nil end
  end
end)

-- Diğer modüllerin (live.lua, protection.lua) kullanabilmesi için köprüle.
Aeigs.getIdents = getIdents
Aeigs.findByLicense = findByLicense

-- ---------------------------------------------------------------------------
-- Heartbeat — sunucuyu çevrimiçi tutar, ayarları (rules) alır
-- ---------------------------------------------------------------------------

local function heartbeat()
  Aeigs.request('/heartbeat', 'POST', {
    acVersion = Config.AcVersion,
    maxSlots = GetConvarInt('sv_maxclients', 48),
    onlineCount = #GetPlayers(),
  }, function(ok, data)
    if ok and data and data.config then
      ServerConfig = data.config
      -- Client tespitleri (silah/ammo/noclip vb.) kuralları bilsin diye yayınla.
      TriggerClientEvent('aeigs:rules', -1, ServerConfig.rules or {})
    end
  end)
end

-- Yeni bağlanan client mevcut kuralları ister.
RegisterNetEvent('aeigs:requestRules', function()
  TriggerClientEvent('aeigs:rules', source, ServerConfig.rules or {})
end)

-- ---------------------------------------------------------------------------
-- Oyuncu senkronizasyonu — license / steam / discord / ip / isim
-- ---------------------------------------------------------------------------

local function syncPlayers()
  local players = {}
  for _, src in ipairs(GetPlayers()) do
    local ids = getIdents(src)
    players[#players + 1] = {
      name = GetPlayerName(src) or ('Player#' .. src),
      license = ids.license,
      steam = ids.steam,
      discord = ids.discord,
      ip = ids.ip,
    }
  end
  Aeigs.request('/players/sync', 'POST', { players = players }, nil)
end

-- ---------------------------------------------------------------------------
-- Ban listesi — cache + girişte kontrol
-- ---------------------------------------------------------------------------

local function refreshBans()
  Aeigs.request('/bans', 'GET', nil, function(ok, data)
    if ok and data and data.bans then
      BanList = data.bans
    end
  end)
end

Aeigs.refreshBans = refreshBans

local function matchBan(ids)
  -- Yalnızca BENZERSİZ kimliklerle eşleştir (license/steam/discord).
  -- IP ile eşleştirme YAPILMAZ: aynı ağdaki/routerdaki masum oyuncular yanlışlıkla
  -- banlanmasın ("banlar karışıyor" sorununun başlıca sebebi buydu).
  for _, b in ipairs(BanList) do
    if (b.license and b.license == ids.license)
        or (b.steam and b.steam == ids.steam)
        or (b.discord and b.discord == ids.discord) then
      return b
    end
  end
  return nil
end

AddEventHandler('playerConnecting', function(name, setKickReason, deferrals)
  local src = source
  deferrals.defer()
  Wait(0)
  local ids = getIdents(src)
  local ban = matchBan(ids)
  if ban then
    local msg = ('⛔ Bu sunucudan yasaklandınız.\n\nSebep: %s\nBan Kodu: %s\n\nSebebi kontrol etmek için: /ban sayfasına kodu girin.')
      :format(ban.reason or 'Belirtilmedi', ban.code or '—')
    deferrals.done(msg)
    Aeigs.log('WARN', 'connect', ('Yasaklı giriş engellendi: %s (%s)'):format(name, ban.code or '-'))
    return
  end
  deferrals.done()
  Aeigs.log('INFO', 'connect', ('%s bağlanıyor'):format(name))
  -- Oyuncu tam katıldıktan sonra listeyi hemen güncelle (panelde anında görünsün)
  CreateThread(function()
    Wait(4000)
    pcall(syncPlayers)
  end)
end)

AddEventHandler('playerDropped', function(reason)
  local src = source
  Aeigs.log('INFO', 'disconnect', ('%s ayrıldı (%s)'):format(GetPlayerName(src) or src, reason or ''))
  -- Ayrılınca listeyi hemen güncelle (panelden düşsün)
  CreateThread(function()
    Wait(1500)
    pcall(syncPlayers)
  end)
end)

-- ---------------------------------------------------------------------------
-- Ceza kuyruğu — panelden gelen WARN / KICK / BAN / UNBAN
-- ---------------------------------------------------------------------------

local function applyAction(a)
  local src = findByLicense(a.identifiers and a.identifiers.license or nil)
  if a.type == 'WARN' then
    if src then
      TriggerClientEvent('chat:addMessage', src, {
        color = { 255, 200, 0 },
        args = { '[Core Shield]', ('⚠ Uyarı: %s'):format(a.reason or '') },
      })
    end
  elseif a.type == 'KICK' then
    if src then DropPlayer(src, ('[Core Shield] Kicklendiniz | Sebep: %s'):format(a.reason or '')) end
  elseif a.type == 'BAN' then
    if src then
      DropPlayer(src, ('[Core Shield] Yasaklandınız | Sebep: %s | Ban Kodu: %s')
        :format(a.reason or '', a.banCode or '—'))
    end
    refreshBans()
  elseif a.type == 'UNBAN' then
    refreshBans()
  end
end

local function pollActions()
  Aeigs.request('/actions/pending', 'GET', nil, function(ok, data)
    if not ok or not data or not data.actions then return end
    local ids = {}
    for _, a in ipairs(data.actions) do
      local success = pcall(applyAction, a)
      if success then ids[#ids + 1] = a.id end
    end
    if #ids > 0 then
      Aeigs.request('/actions/ack', 'POST', { actionIds = ids }, nil)
    end
  end)
end

-- ---------------------------------------------------------------------------
-- Konsol komut kuyruğu — panelden gelen komutlar + kaynak start/stop/restart
-- ---------------------------------------------------------------------------

local function pollCommands()
  Aeigs.request('/commands/pending', 'GET', nil, function(ok, data)
    if not ok or not data or not data.commands then return end
    local ids = {}
    for _, c in ipairs(data.commands) do
      local success = pcall(ExecuteCommand, c.command)
      Aeigs.log('INFO', 'console', ('> %s'):format(c.command))
      if success then ids[#ids + 1] = c.id end
    end
    if #ids > 0 then
      Aeigs.request('/commands/ack', 'POST', { commandIds = ids }, nil)
    end
  end)
end

-- ---------------------------------------------------------------------------
-- Kaynak (resource) senkronizasyonu
-- ---------------------------------------------------------------------------

local function syncResources()
  local list = {}
  local num = GetNumResources()
  for i = 0, num - 1 do
    local rname = GetResourceByFindIndex(i)
    if rname then
      local state = GetResourceState(rname)
      list[#list + 1] = { name = rname, state = (state == 'started') and 'started' or 'stopped' }
    end
  end
  Aeigs.request('/resources/sync', 'POST', { resources = list }, nil)
end

-- ---------------------------------------------------------------------------
-- Log gönderimi
-- ---------------------------------------------------------------------------

local function flushLogs()
  if #LogBuffer == 0 then return end
  local batch = {}
  for i = 1, math.min(#LogBuffer, 50) do batch[i] = LogBuffer[i] end
  -- gönderilenleri çıkar
  for _ = 1, #batch do table.remove(LogBuffer, 1) end
  Aeigs.request('/logs', 'POST', { logs = batch }, nil)
end

-- ---------------------------------------------------------------------------
-- Ban anının kanıtı: gerçek ekran görüntüsü serisi. /detections'ın döndürdüğü
-- screenshotRequestIds'i, oyuncu DropPlayer ile atılmadan ÖNCE client'ın
-- mevcut 'aeigs:screenshot' handler'ına (client/main.lua) sırayla tetikler —
-- screenshot-basic kurulu değilse client tarafı sessizce FAILED'a düşer.
-- ---------------------------------------------------------------------------
-- Not: DropPlayer'ı burst BİTENE kadar bekletiyoruz — aksi halde oyuncu
-- ilk kareyi bile alamadan bağlantısı kesilir. onDone, burst sonunda
-- (veya id yok/yüklenemiyorsa hemen) çağrılır.
local function fireScreenshotBurst(src, ids, onDone)
  local base = (ids and #ids > 0) and Aeigs.screenshotUploadBase and Aeigs.screenshotUploadBase() or nil
  if not base then onDone() return end
  CreateThread(function()
    for _, rid in ipairs(ids) do
      if not GetPlayerName(src) then break end
      TriggerClientEvent('aeigs:screenshot', src, base, rid, nil)
      Wait(400)
    end
    onDone()
  end)
end

-- ---------------------------------------------------------------------------
-- Client tespit köprüsü — client 'aeigs:report' ile bildirir → API'ye yaz
-- ---------------------------------------------------------------------------

RegisterNetEvent('aeigs:report', function(dtype, severity, details)
  local src = source
  if Aeigs.eventLimited(src, 'report', 30, 10000) then return end
  local ids = getIdents(src)
  local pname = GetPlayerName(src) or ('Player#' .. src)
  -- Merkezi tehdit skoruna besle (server/threat_engine.lua) — cross-signal
  -- korelasyon için. Client'tan doğrudan çağrılamaz, bu yüzden bridge burada.
  if Aeigs.threatSignal then Aeigs.threatSignal(src, tostring(dtype or 'UNKNOWN'), details) end
  Aeigs.request('/detections', 'POST', {
    type = tostring(dtype or 'UNKNOWN'),
    severity = tostring(severity or 'MEDIUM'),
    playerName = pname,
    license = ids.license,
    details = type(details) == 'table' and details or { info = tostring(details or '') },
  }, function(ok, data)
    if not (ok and data and GetPlayerName(src)) then return end
    -- Aksiyon (LOG/KICK/BAN) panelden tespit tipi bazında seçilir; karar
    -- web API'sinde verilir (server.config.actions), burada uygulanır.
    if data.banned then
      fireScreenshotBurst(src, data.screenshotRequestIds, function()
        if GetPlayerName(src) then
          DropPlayer(src, ('[Core Shield] Yasaklandınız | Sebep: %s | Ban Kodu: %s')
            :format(tostring(dtype or ''), data.banCode or '—'))
        end
      end)
      refreshBans()
    elseif data.kicked then
      DropPlayer(src, ('[Core Shield] Kicklendiniz | Sebep: %s'):format(tostring(dtype or '')))
    end
  end)
end)

-- ---------------------------------------------------------------------------
-- CoreAC modülleri server-taraflı tespit köprüsü (bridge/server.lua'dan gelir)
-- ---------------------------------------------------------------------------
AddEventHandler('aeigs:serverReport', function(src, dtype, severity, details)
  src = tonumber(src)
  if not src or src <= 0 then return end
  if not GetPlayerName(src) then return end
  if Aeigs.eventLimited(src, 'serverReport', 30, 10000) then return end
  local ids = getIdents(src)
  local pname = GetPlayerName(src) or ('Player#' .. src)
  if Aeigs.threatSignal then Aeigs.threatSignal(src, tostring(dtype or 'UNKNOWN'), details) end
  Aeigs.request('/detections', 'POST', {
    type = tostring(dtype or 'UNKNOWN'),
    severity = tostring(severity or 'MEDIUM'),
    playerName = pname,
    license = ids.license,
    details = type(details) == 'table' and details or { info = tostring(details or '') },
  }, function(ok, data)
    if not (ok and data and GetPlayerName(src)) then return end
    if data.banned then
      fireScreenshotBurst(src, data.screenshotRequestIds, function()
        if GetPlayerName(src) then
          DropPlayer(src, ('[Core Shield] Yasaklandınız | Sebep: %s | Ban Kodu: %s')
            :format(tostring(dtype or ''), data.banCode or '—'))
        end
      end)
      refreshBans()
    elseif data.kicked then
      DropPlayer(src, ('[Core Shield] Kicklendiniz | Sebep: %s'):format(tostring(dtype or '')))
    end
  end)
end)

-- ---------------------------------------------------------------------------
-- Döngüler
-- ---------------------------------------------------------------------------

CreateThread(function()
  if not Config.Token or Config.Token == '' then
    print('^1[Core Shield] UYARI: aeigs_token ayarlanmadı. server.cfg içine token ekleyin.^7')
    return
  end
  print('^2[Core Shield] Anti-Cheat başlatıldı. Panele bağlanılıyor...^7')
  refreshBans()
  heartbeat()
  syncResources()

  local function loop(interval, fn)
    CreateThread(function()
      while true do
        Wait(interval * 1000)
        pcall(fn)
      end
    end)
  end

  loop(Config.HeartbeatInterval, heartbeat)
  loop(Config.PlayerSyncInterval, syncPlayers)
  loop(Config.ActionPollInterval, pollActions)
  loop(Config.ActionPollInterval, pollCommands)
  loop(Config.BanRefreshInterval, refreshBans)
  loop(Config.ResourceSyncInterval, syncResources)
  loop(Config.LogFlushInterval, flushLogs)
end)
