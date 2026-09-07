-- server/godmode_guard.lua — QBCore uyumlu, false positive düzeltilmiş
--
-- SORUN: Önceki versiyon joinTime'dan itibaren 40sn sayıyordu.
-- Ama QBCore'da oyuncu bağlanır → seçim ekranı → karakter seçer →
-- spawn olur. Bu süreç 1-2 dakika sürebilir. Join zamanından saymak
-- yanlış — asıl spawn zamanından saymak lazım.
--
-- YENİ YAKLAŞIM:
--   QBCore 'QBCore:Server:PlayerLoaded' event'ini spawn tamamlanınca atar.
--   Biz bu event'i dinliyoruz, gerçek spawn zamanını kaydediyoruz.
--   Bu event gelene kadar o oyuncuya hiç godmode kontrolü yapmıyoruz.

local SPAWN_GRACE  = 10000  -- spawn event'inden sonra 10sn muaf (yeterli tampon)
local VEH_GRACE    = 5000
local REVIVE_GRACE = 8000
local MIN_DAMAGE   = 3

local playerState = {}

local function getState(src)
  if not playerState[src] then
    playerState[src] = {
      joinTime    = GetGameTimer(),
      spawnTime   = nil,   -- nil = henüz spawn olmadı, kontrol yapma
      lastVehExit = 0,
      lastRevive  = 0,
      strikes     = 0,
      lastStrike  = 0,
    }
  end
  return playerState[src]
end

-- QBCore: oyuncu spawn tamamlandı
AddEventHandler('QBCore:Server:PlayerLoaded', function(Player)
  local src = Player.PlayerData.source
  if not src then return end
  local st = getState(src)
  st.spawnTime = GetGameTimer()
end)

-- QBCore: karakter değişimi veya logout
AddEventHandler('QBCore:Server:PlayerUnload', function(src)
  if playerState[src] then
    playerState[src].spawnTime = nil  -- tekrar spawn bekle
  end
end)

-- Revive bildirimi
-- QBCore hastane scriptin içinde şunu ekle:
--   TriggerEvent('aeigs:revived', src)
AddEventHandler('aeigs:revived', function(src)
  local st = getState(tonumber(src))
  st.lastRevive = GetGameTimer()
end)

-- QBCore hospital entegrasyonu (yaygın scriptler)
AddEventHandler('hospital:server:RevivePlayer', function(src)
  local st = getState(tonumber(src))
  if st then st.lastRevive = GetGameTimer() end
end)

-- Oyuncu ayrıldı
AddEventHandler('playerDropped', function()
  playerState[source] = nil
end)

-- Ana tespit
AddEventHandler('weaponDamageEvent', function(data)
  local src = source
  if not src or src <= 0 then return end

  local st  = getState(src)
  local now = GetGameTimer()

  -- Henüz spawn olmadı → kontrol yapma
  if not st.spawnTime then return end

  -- Spawn grace
  if (now - st.spawnTime) < SPAWN_GRACE then return end

  -- Revive grace
  if (now - st.lastRevive) < REVIVE_GRACE then return end

  -- Küçük hasar atla
  local dmg = data.weaponDamage or 0
  if dmg < MIN_DAMAGE then return end

  local ped = GetPlayerPed(src)
  if not ped or ped == 0 then return end

  -- Araç kontrolü
  local veh = GetVehiclePedIsIn(ped, false)
  if veh and veh ~= 0 then return end
  if (now - st.lastVehExit) < VEH_GRACE then return end

  local hpBefore  = GetEntityHealth(ped)
  local armBefore = GetPedArmour(ped)

  SetTimeout(350, function()
    local pedNow = GetPlayerPed(src)
    if not pedNow or pedNow == 0 then return end

    local hpAfter  = GetEntityHealth(pedNow)
    local armAfter = GetPedArmour(pedNow)

    local hpDrop  = hpBefore  - hpAfter
    local armDrop = armBefore - armAfter

    if hpDrop < 2 and armDrop < 2 then
      -- Strike: 20sn içinde 3 kez yakalanırsa ban
      local timeSinceLast = now - st.lastStrike
      if timeSinceLast > 20000 then
        st.strikes = 0  -- süre geçti, sıfırla
      end

      st.strikes    = st.strikes + 1
      st.lastStrike = now

      if st.strikes >= 3 then
        st.strikes = 0
        if Aeigs and Aeigs.report then
          Aeigs.report(src, 'GODMODE', 'CRITICAL', {
            source    = 'damage_no_hp_drop',
            dmg       = dmg,
            hpBefore  = hpBefore,
            hpAfter   = hpAfter,
            armBefore = armBefore,
            armAfter  = armAfter,
          })
        else
          DropPlayer(tostring(src), '[Aeigs AC] Godmode tespit edildi.')
        end
      end
    else
      -- Hasar gerçek, temiz
      if (now - st.lastStrike) > 20000 then
        st.strikes = 0
      end
    end
  end)
end)

-- Araçtan çıkış takibi
CreateThread(function()
  local pedVehMap = {}
  while true do
    Wait(1000)
    for _, src in ipairs(GetPlayers()) do
      local srcN = tonumber(src)
      if srcN then
        local ped    = GetPlayerPed(srcN)
        local veh    = ped and GetVehiclePedIsIn(ped, false) or 0
        local inVeh  = veh ~= 0
        local wasIn  = pedVehMap[srcN] or false

        if wasIn and not inVeh then
          local st = getState(srcN)
          st.lastVehExit = GetGameTimer()
        end
        pedVehMap[srcN] = inVeh
      end
    end
  end
end)
