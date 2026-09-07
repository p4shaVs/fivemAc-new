-- Core Shield Anti-Cheat — sunucu taraflı korumalar
-- Panelden açılan "Güvenlik Kuralları" (heartbeat config.rules) burada okunur.
-- Başlangıç için çoğu kural RAPOR eder (report-only). Engellemeyi (CancelEvent)
-- açmak isterseniz ilgili yerdeki yorumu aktifleştirin — önce test edin.

local function ruleOn(key)
  local r = Aeigs.getRules()
  return r[key] == true
end

-- Basit oran sınırlayıcı (spam tespiti)
local hits = {}
local function tooFast(key, limit, windowMs)
  local now = GetGameTimer()
  local b = hits[key]
  if not b or now > b.reset then
    hits[key] = { count = 1, reset = now + windowMs }
    return false
  end
  b.count = b.count + 1
  return b.count > limit
end

local function name(src) return GetPlayerName(src) or ('Player#' .. src) end

-- ---------------------------------------------------------------------------
-- Patlama koruması
-- ---------------------------------------------------------------------------
-- Patlayıcı mermi sayaçları (oyuncu bazlı, kayan pencere)
local expBullet = {}

AddEventHandler('explosionEvent', function(sender, ev)
  -- sender: patlamayı tetikleyen oyuncu (net id string olabilir)
  local src = tonumber(sender)
  if not src or src <= 0 then return end
  local etype = ev and ev.explosionType

  -- Patlayıcı mermi (explosionType 18 = BULLET). TİTİZ: tek patlama değil,
  -- kısa sürede birden fazla mermi-patlaması = patlayıcı mermi hilesi.
  if ruleOn('anti_explosive_bullets') and etype == 18 then
    local now = GetGameTimer()
    local b = expBullet[src]
    if not b or now > b.reset then b = { n = 0, reset = now + 8000 }; expBullet[src] = b end
    b.n = b.n + 1
    if b.n > (Config.ExplosiveBulletMax or 4) then
      expBullet[src] = nil
      CancelEvent()
      TriggerEvent('aeigs:serverReport', src, 'EXPLOSIVE_BULLETS', 'CRITICAL', { count = b.n })
      return
    end
  end

  if ruleOn('anti_explosion_spam') then
    if tooFast('expl:' .. src, 8, 10000) then
      TriggerEvent('aeigs:serverReport', src, 'EXPLOSION', 'HIGH', { type = etype })
      -- Engellemek için: CancelEvent()
    end
  end
end)

-- ---------------------------------------------------------------------------
-- İzinsiz entity (araç/ped/obje) spam koruması
-- ---------------------------------------------------------------------------
AddEventHandler('entityCreating', function(handle)
  local owner = NetworkGetEntityOwner(handle)
  if not owner or owner <= 0 then return end
  local etype = GetEntityType(handle) -- 1=ped, 2=vehicle, 3=object

  -- Kara liste kontrolü: yasaklı model ise oluşturmayı iptal et + uygula.
  local model = GetEntityModel(handle)
  local entry = Aeigs.blacklistLookup and Aeigs.blacklistLookup(model)
  if entry then
    local kindMap = { vehicle = 2, ped = 1, object = 3 }
    if kindMap[entry.kind] == etype then
      CancelEvent() -- yasaklı entity oluşmasın
      Aeigs.enforceBlacklist(owner, entry, model)
      return
    end
  end

  local key
  if etype == 2 and ruleOn('anti_vehicle_spawn') then key = 'veh'
  elseif etype == 1 and ruleOn('anti_ped_spawn') then key = 'ped'
  elseif etype == 3 and ruleOn('anti_object_spawn') then key = 'obj' end
  if key and ruleOn('anti_entity_spam') then
    if tooFast(('ent:%s:%s'):format(key, owner), 30, 10000) then
      local tmap = { veh = 'ILLEGAL_VEHICLE', ped = 'ILLEGAL_PED', obj = 'ILLEGAL_OBJECT' }
      TriggerEvent('aeigs:serverReport', owner, tmap[key], 'MEDIUM', { entityType = etype })
      -- Engellemek için: CancelEvent()
    end
  end
end)

-- ---------------------------------------------------------------------------
-- SILENT AIM / MAGIC BULLET — client gerçek nişan yönünü bildirir; burada
-- vurulan oyuncu ile nişan yönü arasındaki açı ölçülür. Yere bakıp kafadan
-- vuruyorsa açı ~90°+ → kesin silent aim. (2 doğrulama.)
-- ---------------------------------------------------------------------------
local aimData = {}
RegisterNetEvent('aeigs:aim', function(px, py, pz, fx, fy, fz)
  if Aeigs.eventLimited(source, 'aim', 20, 1000) then return end
  aimData[source] = {
    pos = vector3(px + 0.0, py + 0.0, pz + 0.0),
    fwd = vector3(fx + 0.0, fy + 0.0, fz + 0.0),
    t = GetGameTimer(),
  }
end)
AddEventHandler('playerDropped', function()
  local s = source
  aimData[s] = nil
end)

local silentStrike = {}

-- ---------------------------------------------------------------------------
-- RAPID FIRE (fire-rate hilesi) — RAPOR-ONLY, yumuşak sinyal.
-- Aynı silahtan ardışık isabetler arasındaki süre, hiçbir gerçek silahın
-- ulaşamayacağı kadar kısaysa (60ms = 1000 rpm üstü) işaretle. Ateş hızı
-- netcode/lag'e duyarlı olduğu için TİTİZ: çok sayıda ardışık ihlal ister,
-- asla ban atmaz — sadece panelde görünür, isterseniz manuel inceleyin.
-- ---------------------------------------------------------------------------
local lastShot = {}      -- [src][weaponHash] = son isabet zamanı
local rapidFireStrike = {}

local function checkRapidFire(src, weaponHash)
  if not ruleOn('anti_rapid_fire') then return end
  lastShot[src] = lastShot[src] or {}
  local now = GetGameTimer()
  local last = lastShot[src][weaponHash]
  lastShot[src][weaponHash] = now
  if not last then return end
  local dt = now - last
  if dt > 0 and dt < 60 then
    rapidFireStrike[src] = (rapidFireStrike[src] or 0) + 1
    if rapidFireStrike[src] >= 8 then
      rapidFireStrike[src] = 0
      TriggerEvent('aeigs:serverReport', src, 'RAPID_FIRE', 'MEDIUM', { weapon = weaponHash, dt = dt })
    end
  else
    rapidFireStrike[src] = 0
  end
end

-- ---------------------------------------------------------------------------
-- WALLBANG / ESP GÖSTERGESİ — RAPOR-ONLY, yumuşak sinyal.
-- Vurulan oyuncu ile atıcı arasında görüş hattı (LOS) TAMAMEN engelliyken
-- (duvarın arkasından, aradaki geometri kesin) isabet gitmesi ESP+ateş
-- kombinasyonuna işaret eder. Netcode/gecikme yüzünden nadiren yanlış
-- olabileceğinden TİTİZ: çok sayıda doğrulama ister, asla ban atmaz.
-- ---------------------------------------------------------------------------
local losStrike = {}

local function checkWallbang(src, victimPed, shooterPed)
  if not ruleOn('anti_wallhack') then return end
  if not DoesEntityExist(shooterPed) or not DoesEntityExist(victimPed) then return end
  local dist = #(GetEntityCoords(shooterPed) - GetEntityCoords(victimPed))
  if dist < 8.0 then return end  -- yakın mesafede duvar-kenarı false riskini azalt
  local clear = HasEntityClearLosToEntity(shooterPed, victimPed, 17)
  if not clear then
    losStrike[src] = (losStrike[src] or 0) + 1
    if losStrike[src] >= 5 then
      losStrike[src] = 0
      TriggerEvent('aeigs:serverReport', src, 'WALLBANG', 'MEDIUM', { dist = math.floor(dist) })
    end
  else
    losStrike[src] = math.max(0, (losStrike[src] or 0) - 1)
  end
end

AddEventHandler('playerDropped', function()
  local s = source
  silentStrike[s] = nil; lastShot[s] = nil; rapidFireStrike[s] = nil; losStrike[s] = nil
end)

-- ---------------------------------------------------------------------------
-- Silah hasarı — imkânsız hasar (temel örnek)
-- ---------------------------------------------------------------------------
AddEventHandler('weaponDamageEvent', function(sender, data)
  local src = tonumber(sender)
  if not src then return end

  -- Silent aim: vurulan oyuncu(lar) ile nişan yönü arasındaki açı
  if ruleOn('anti_silent_aim') and data and (data.hitGlobalIds or data.hitGlobalId)
      and not (Aeigs.isWhitelisted and Aeigs.isWhitelisted(src)) then
    local aim = aimData[src]
    if aim and (GetGameTimer() - aim.t) < 800 then
      local ids = data.hitGlobalIds or { data.hitGlobalId }
      for _, nid in ipairs(ids) do
        local ent = NetworkGetEntityFromNetworkId(nid)
        if ent and ent ~= 0 and GetEntityType(ent) == 1 and IsPedAPlayer(ent) then
          local dir = GetEntityCoords(ent) - aim.pos
          local dist = #dir
          if dist > 5.0 then
            dir = dir / dist
            local dot = aim.fwd.x * dir.x + aim.fwd.y * dir.y + aim.fwd.z * dir.z
            if dot < 0.15 then
              -- Nişan hedefte HİÇ değilken (>81° sapma — ör. yere bakarken
              -- kafadan vuruş) hit gitmesi fiziksel olarak imkânsız: tek
              -- seferde ban (kullanıcı isteği: "aim hedefte değilken bile
              -- ateş açılıp hit gidiyorsa hemen banla").
              TriggerEvent('aeigs:serverReport', src, 'SILENT_AIM', 'CRITICAL', { angleCos = math.floor(dot * 100) / 100, confirm = 1 })
            elseif dot < 0.5 then
              -- Orta derece sapma (~60-81°) — 2 doğrulama ile false önle
              silentStrike[src] = (silentStrike[src] or 0) + 1
              if silentStrike[src] >= 2 then
                silentStrike[src] = 0
                TriggerEvent('aeigs:serverReport', src, 'SILENT_AIM', 'CRITICAL', { angleCos = math.floor(dot * 100) / 100, confirm = 2 })
              end
            end
          end
        end
      end
    end
  end

  -- Rapid fire + wallbang/ESP (rapor-only, yumuşak sinyaller) — oyuncu
  -- hedeflerine bakar, whitelist'li atıcılar hariç tutulur.
  if data and (data.hitGlobalIds or data.hitGlobalId)
      and not (Aeigs.isWhitelisted and Aeigs.isWhitelisted(src)) then
    if data.weaponType then checkRapidFire(src, data.weaponType) end
    local shooterPed = GetPlayerPed(src)
    local ids2 = data.hitGlobalIds or { data.hitGlobalId }
    for _, nid in ipairs(ids2) do
      local ent = NetworkGetEntityFromNetworkId(nid)
      if ent and ent ~= 0 and GetEntityType(ent) == 1 and IsPedAPlayer(ent) then
        checkWallbang(src, ent, shooterPed)
      end
    end
  end

  -- Kara listedeki silah kullanımı
  if data and data.weaponType then
    local entry = Aeigs.blacklistLookup and Aeigs.blacklistLookup(data.weaponType)
    if entry and entry.kind == 'weapon' then
      CancelEvent()
      Aeigs.enforceBlacklist(src, entry, data.weaponType)
      return
    end
  end

  if ruleOn('anti_illegal_weapon') and data and data.weaponDamage and data.weaponDamage > 2000 then
    TriggerEvent('aeigs:serverReport', src, 'ILLEGAL_WEAPON', 'HIGH', { dmg = data.weaponDamage })
    -- Engellemek için: CancelEvent()
  end

  -- Damage Multiplier limiti — tek atışta anormal hasar. TİTİZ: birkaç kez
  -- üst üste tavanı aşınca raporla (tek fluke ban atmasın).
  if ruleOn('anti_damage_multiplier') and data and data.weaponDamage
      and data.weaponDamage > (Config.MaxWeaponDamage or 400)
      and data.weaponDamage <= 2000 then
    if tooFast('dmgmul:' .. src, (Config.DamageConfirmHits or 2) - 1, 6000) then
      TriggerEvent('aeigs:serverReport', src, 'DAMAGE_MULTIPLIER', 'CRITICAL', { dmg = math.floor(data.weaponDamage) })
    end
  end
end)

-- ---------------------------------------------------------------------------
-- giveWeaponEvent — kara listedeki silah bu event'le verilmeye çalışılırsa engelle
-- ---------------------------------------------------------------------------
AddEventHandler('giveWeaponEvent', function(sender, data)
  local src = tonumber(sender)
  if not src then return end
  local hash = data and (data.weaponType or data.weaponHash)
  if hash and Aeigs.blacklistLookup then
    local entry = Aeigs.blacklistLookup(hash)
    if entry and entry.kind == 'weapon' then
      CancelEvent()
      Aeigs.enforceBlacklist(src, entry, hash)
    end
  end
end)

-- ---------------------------------------------------------------------------
-- Ortak rapor köprüsü (sunucu tespiti → API)
-- ---------------------------------------------------------------------------
-- Ban anının kanıtı: gerçek ekran görüntüsü serisi. DropPlayer'ı burst
-- bitene kadar bekletir (aksi halde oyuncu ilk kareyi bile alamadan atılır).
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

AddEventHandler('aeigs:serverReport', function(src, dtype, severity, details)
  -- Bypass'lı oyuncular (yöneticiler/içerik üreticiler) raporlanmaz.
  if Aeigs.isWhitelisted and Aeigs.isWhitelisted(src) then return end
  -- Merkezi tehdit skoruna besle — THREAT_SCORE'un kendi ürettiği raporu
  -- tekrar kendine beslemesi (sonsuz döngü) İSTENMEZ, o yüzden hariç tutulur.
  if dtype ~= 'THREAT_SCORE' and Aeigs.threatSignal then
    Aeigs.threatSignal(src, dtype, details)
  end
  local ids = {}
  for _, id in ipairs(GetPlayerIdentifiers(src)) do
    if id:sub(1, 8) == 'license:' then ids.license = id break end
  end
  Aeigs.request('/detections', 'POST', {
    type = dtype,
    severity = severity or 'MEDIUM',
    playerName = name(src),
    license = ids.license,
    details = details or {},
  }, function(ok, data)
    if not (ok and data and GetPlayerName(src)) then return end
    -- Aksiyon panelden (Yapılandırma → Aksiyonlar) tespit tipi bazında seçilir:
    -- LOG (yalnızca kaydet) / KICK (at) / BAN (yasakla). Karar web API'sinde
    -- server.config.actions'a göre verilir; burada sadece uygulanır.
    if data.banned then
      fireScreenshotBurst(src, data.screenshotRequestIds, function()
        if GetPlayerName(src) then
          DropPlayer(src, ('[Core Shield] Yasaklandınız | Sebep: %s | Ban Kodu: %s')
            :format(tostring(dtype or ''), data.banCode or '—'))
        end
      end)
      if Aeigs.refreshBans then Aeigs.refreshBans() end
    elseif data.kicked then
      DropPlayer(src, ('[Core Shield] Kicklendiniz | Sebep: %s'):format(tostring(dtype or '')))
    end
  end)
  Aeigs.log('DETECTION', 'anticheat', ('%s → %s'):format(dtype, name(src)))
end)
