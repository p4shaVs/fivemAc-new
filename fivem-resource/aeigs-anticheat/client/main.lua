-- main.lua — Core Shield Anti-Cheat, client (DÜZELTİLMİŞ)
-- (Tespitler client/detections/*.lua içindedir. Bu dosya tespit YAPMAZ.)
--
-- DEĞİŞİKLİKLER:
--   - aeigs:collState Wait(250) → Wait(100): sunucunun teleport taraması
--     1sn'de bir çalışıyor. 250ms'de sinyal gönderilince sunucu önce davranıp
--     noclip'i "TELEPORT" diye etiketliyordu. 100ms ile artık sunucudan önce geliriz.
--   - underground tespiti genişletildi: zemin altına girme (noclip'in duvar/zemin
--     geçişi) daha geniş threshold ile yakalanıyor (-0.6 → -0.3)
--   - collState event'e "underground" bilgisi ayrı gönderiliyor ki sunucu
--     noclip ile teleport'u daha iyi ayırt edebilsin

local function currentActivity(ped)
  if IsPedInAnyVehicle(ped, false) then return 'driving'     end
  if IsPedSwimming(ped)            then return 'swimming'    end
  if GetPedParachuteState(ped) > 0 then return 'parachuting' end
  if IsPedShooting(ped)            then return 'shooting'    end
  if IsPedRagdoll(ped)             then return 'ragdoll'     end
  if IsPedFalling(ped)             then return 'falling'     end
  if GetEntitySpeed(ped) > 1.0     then return 'walking'     end
  return 'idle'
end

-- Canlı konum / can / kalkan
CreateThread(function()
  while true do
    Wait((Config.PositionInterval or 3) * 1000)
    local ped = PlayerPedId()
    local c   = GetEntityCoords(ped)
    TriggerServerEvent('aeigs:pos', {
      x        = c.x,
      y        = c.y,
      z        = c.z,
      heading  = GetEntityHeading(ped),
      health   = GetEntityHealth(ped),
      armor    = GetPedArmour(ped),
      activity = currentActivity(ped),
    })
  end
end)

-- Collision / noclip sinyali
-- FIX: Wait(250) → Wait(100) — sunucu teleport taramasından önce gelsin
-- FIX: underground eşiği -0.6 → -0.3 — daha hassas zemin altı tespiti
-- FIX: collisionDisabled ve underground ayrı gönderiliyor (sunucu ayırt edebilsin)
CreateThread(function()
  while true do
    Wait(100)  -- FIX: 250'den 100'e düşürüldü
    local ped              = PlayerPedId()
    local height           = GetEntityHeightAboveGround(ped)
    local collisionDisabled = GetEntityCollisionDisabled(ped)

    -- FIX: eşik -0.6 → -0.3 (daha hassas)
    local underground = height ~= nil
      and height < -0.3
      and not IsPedFalling(ped)
      and not IsPedRagdoll(ped)
      and not IsPedInAnyVehicle(ped, false)

    -- FIX: sunucuya collision ve underground ayrı bildirildi
    -- Sunucu: collision=true → noclip şüphesi
    --         underground=true → noclip şüphesi (teleport değil)
    --         her ikisi false → temiz
    TriggerServerEvent('aeigs:collState', collisionDisabled, underground)
  end
end)

-- İzleme / ekran görüntüsü (screenshot-basic)
RegisterNetEvent('aeigs:screenshot', function(uploadUrl, reqId, adminId)
  if GetResourceState('screenshot-basic') ~= 'started' then
    TriggerServerEvent('aeigs:screenshotResult', reqId, nil, adminId)
    return
  end
  exports['screenshot-basic']:requestScreenshotUpload(
    uploadUrl,
    Config.ScreenshotField or 'files[]',
    function(data)
      local url    = nil
      local ok, parsed = pcall(json.decode, data)
      if ok and parsed then
        url = parsed.url
          or (parsed.files and parsed.files[1])
          or (parsed.data and parsed.data.url)
      end
      TriggerServerEvent('aeigs:screenshotResult', reqId, url or data, adminId)
    end
  )
end)
