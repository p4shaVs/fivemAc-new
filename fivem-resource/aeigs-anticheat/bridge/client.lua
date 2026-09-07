-- =============================================================================
-- Aeigs × CoreAC Bridge — Client Side
-- Modules client dosyalarının ihtiyaç duyduğu tüm CoreAC client global'leri
-- =============================================================================

-- Aeigs = client tarafı global (client/core.lua'dan gelir)
Aeigs = Aeigs or {}

-- ---------------------------------------------------------------------------
-- CoreAC.DetectPlayer (Client)
-- Modules client dosyaları (godMode.lua, noclip.lua, vb.) bu fonksiyonu çağırır.
-- İmza: CoreAC.DetectPlayer(reason, details, action, duration)
-- Aeigs.report → TriggerServerEvent('aeigs:report', ...) zinciri üzerinden gider.
-- ---------------------------------------------------------------------------
CoreAC.DetectPlayer = function(reason, details, action, duration)
    local detType = tostring(reason or 'UNKNOWN')
    local severity = 'HIGH'
    if action == CoreAC.Actions.BAN.id or action == 'BAN' then severity = 'CRITICAL' end
    if action == CoreAC.Actions.KICK.id or action == 'KICK' then severity = 'HIGH' end

    local det = {}
    if type(details) == 'table' then
        det = details
    elseif details ~= nil then
        det = { info = tostring(details) }
    end

    -- Aeigs'in mevcut report sistemi ile gönder
    if Aeigs and Aeigs.report then
        Aeigs.report(detType, severity, det)
    else
        TriggerServerEvent('aeigs:report', detType, severity, det)
    end

    -- Heartbeat fake detection kontrolü (heartbeat/client.lua için)
    return GetGameTimer()
end

-- ---------------------------------------------------------------------------
-- Native Referansları — modules güvenli native erişimi için
-- (misc.lua, noclip.lua, vb. CoreAC.Native.* kullanır)
-- ---------------------------------------------------------------------------
CoreAC.Native = {
    GetGameTimer            = GetGameTimer,
    PlayerId                = PlayerId,
    PlayerPedId             = PlayerPedId,
    GetEntityCoords         = GetEntityCoords,
    GetEntityHealth         = GetEntityHealth,
    GetPedArmour            = GetPedArmour,
    GetEntitySpeed          = GetEntitySpeed,
    GetEntityHeading        = GetEntityHeading,
    GetEntityVelocity       = GetEntityVelocity,
    GetEntityModel          = GetEntityModel,
    GetEntityType           = GetEntityType,
    GetEntityBonePosition_2 = GetEntityBonePosition_2,
    GetPedBoneCoords        = GetPedBoneCoords,
    GetGroundZFor_3dCoord   = GetGroundZFor_3dCoord,
    GetEntityHeightAboveGround = GetEntityHeightAboveGround,
    GetEntityCollisionDisabled = GetEntityCollisionDisabled,
    GetVehiclePedIsIn       = GetVehiclePedIsIn,
    GetVehicleCurrentGear   = GetVehicleCurrentGear,
    GetEntitySubmergedLevel = GetEntitySubmergedLevel,
    NetworkGetEntityOwner   = NetworkGetEntityOwner,
    GetPlayerServerId       = GetPlayerServerId,
    IsPedInAnyVehicle       = IsPedInAnyVehicle,
    IsPedFalling            = IsPedFalling,
    IsPedRagdoll            = IsPedRagdoll,
    IsPedDead               = IsPedDead,
    IsEntityPositionFrozen  = IsEntityPositionFrozen,
    GetPedInVehicleSeat     = GetPedInVehicleSeat,
    HasEntityBeenDamagedByAnyVehicle = HasEntityBeenDamagedByAnyVehicle,
    GetGameplayCamCoord     = GetGameplayCamCoord,
    GetGameplayCamRot       = GetGameplayCamRot,
    GetFinalRenderedCamCoord = GetFinalRenderedCamCoord,
    GetFinalRenderedCamRot  = GetFinalRenderedCamRot,
    GetAimBlendFromPlayerToCoord = GetAimBlendFromPlayerToCoord,
    GetCamCoord             = GetCamCoord,
    GetCamRot               = GetCamRot,
    GetCamFov               = GetCamFov,
    IsCamActive             = IsCamActive,
    GetPlayerPed            = GetPlayerPed,
}

-- ---------------------------------------------------------------------------
-- Lua Standart Fonksiyon Referansları — misc.lua ve diğerleri için
-- ÖNEMLI: Sadece çağrılabilir (callable) fonksiyonlar buraya giriyor.
-- misc.lua bu tablodaki her entry'yi _G[key]({}) ile çağırıyor;
-- math/string/table gibi tablo objeleri hataya yol açar.
-- ---------------------------------------------------------------------------
CoreAC.Lua = {
    pairs        = pairs,
    ipairs       = ipairs,
    pcall        = pcall,
    xpcall       = xpcall,
    print        = print,
    tostring     = tostring,
    tonumber     = tonumber,
    type         = type,
    select       = select,
    next         = next,
    rawget       = rawget,
    rawset       = rawset,
    setmetatable = setmetatable,
    getmetatable = getmetatable,
    -- NOT: math, string, table intentionally excluded — they are tables, not functions.
    -- misc.lua calls _G[name]({}) for each entry; calling math({}) throws an error.
}

-- math/string/table'a CoreAC.Lua üzerinden erişim için ayrı referanslar
-- (misc.lua bunları döngüde aramaz, sadece kod içinde kullanırsa çalışsın)
CoreAC.math   = math
CoreAC.string = string
CoreAC.table  = table
CoreAC.unpack = table.unpack

}

-- ---------------------------------------------------------------------------
-- debug referansı — misc.lua getinfo için
-- ---------------------------------------------------------------------------
CoreAC.debug = {
    getinfo = debug.getinfo,
}

-- ---------------------------------------------------------------------------
-- Yardımcı tip fonksiyonları — modules kullanır
-- ---------------------------------------------------------------------------
CoreAC.tonumber = tonumber
CoreAC.type = type

function NumberToBoolean(val)
    if val == nil then return false end
    if type(val) == 'boolean' then return val end
    return val ~= 0
end

-- ---------------------------------------------------------------------------
-- LoadResourceFile — misc.lua için
-- ---------------------------------------------------------------------------
CoreAC.LoadResourceFile = LoadResourceFile

-- ---------------------------------------------------------------------------
-- StateBag okuma — misc.lua için
-- ---------------------------------------------------------------------------
CoreAC.GetSecuredStateBag = function(key)
    local serverId = GetPlayerServerId(PlayerId())
    local bagName = ('player:%d'):format(serverId)
    return GetStateBagValue(bagName, key)
end

-- ---------------------------------------------------------------------------
-- Oyuncu Durum Önbelleği — tüm modules client dosyaları kullanır
-- Bu thread her 250ms'de oyuncu durumunu günceller; modules dosyaları
-- CoreAC.playerPed, CoreAC.playerCoords, vb. okur.
-- ---------------------------------------------------------------------------
CoreAC.playerPed          = PlayerPedId()
CoreAC.playerCoords       = vector3(0, 0, 0)
CoreAC.playerHealth       = 200
CoreAC.playerMaxHealth    = 200
CoreAC.playerArmour       = 0
CoreAC.playerSpeed        = 0.0
CoreAC.playerHeight       = 0.0
CoreAC.playerHeading      = 0.0
CoreAC.playerVelocity     = vector3(0, 0, 0)
CoreAC.playerModel        = 0
CoreAC.pedType            = 0
CoreAC.isPlayerDead       = false
CoreAC.isPlayerInVehicle  = false
CoreAC.isPlayerDriver     = false
CoreAC.isPedFalling       = false
CoreAC.isPedRagdoll       = false
CoreAC.isPedOnVehicle     = false
CoreAC.vehicleSpeed       = 0.0
CoreAC.playerCurrentVehicle = 0
CoreAC.isAttachedToAPlayer  = false
CoreAC.isPedJumpingOutOfVehicle = false
CoreAC.isPedRunningRagdollTask  = false
CoreAC.playerSpawned      = false

-- Flag'ler (shared.js ve godMode.lua tarafından set edilir)
CoreAC.hasTeleported      = false
CoreAC.hasChangedPedModel = false
CoreAC.playerRevived      = false
CoreAC.healthRefilled     = false
CoreAC.proofsEnabled      = false
CoreAC.canBeDamaged       = true
CoreAC.isInvincible       = false
CoreAC.entityCanBeDamaged = true
CoreAC.playerInvincible   = false
CoreAC.playerInvincible2  = false
CoreAC.isVisible          = true

-- Heartbeat için zaman damgası
CoreAC.lastActorLoopTime  = GetGameTimer()

-- Ana durum güncelleme thread'i
CreateThread(function()
    -- Spawn grace süresi bekle
    Wait(5000)
    CoreAC.playerSpawned = true

    while true do
        local ped = PlayerPedId()
        CoreAC.playerPed        = ped
        CoreAC.playerCoords     = GetEntityCoords(ped)
        CoreAC.playerHealth     = GetEntityHealth(ped)
        CoreAC.playerMaxHealth  = GetEntityMaxHealth(ped)
        CoreAC.playerArmour     = GetPedArmour(ped)
        CoreAC.playerSpeed      = GetEntitySpeed(ped)
        CoreAC.playerHeading    = GetEntityHeading(ped)
        CoreAC.playerVelocity   = GetEntityVelocity(ped)
        CoreAC.playerHeight     = GetEntityHeightAboveGround(ped)
        CoreAC.playerModel      = GetEntityModel(ped)
        CoreAC.pedType          = GetPedType(ped)
        CoreAC.isPlayerDead     = IsEntityDead(ped) or IsPedDeadOrDying(ped, true)
        CoreAC.isPedFalling     = IsPedFalling(ped)
        CoreAC.isPedRagdoll     = IsPedRagdoll(ped)
        CoreAC.isPedOnVehicle   = IsPedOnVehicle(ped, false)
        CoreAC.isPedRunningRagdollTask = IsPedRunningRagdollTask(ped)
        CoreAC.isPedJumpingOutOfVehicle = IsPedJumpingOutOfVehicle(ped)

        local veh = GetVehiclePedIsIn(ped, false)
        CoreAC.playerCurrentVehicle = veh
        CoreAC.isPlayerInVehicle    = veh ~= 0
        if veh ~= 0 then
            CoreAC.isPlayerDriver  = (GetPedInVehicleSeat(veh, -1) == ped)
            CoreAC.vehicleSpeed    = GetEntitySpeed(veh)
        else
            CoreAC.isPlayerDriver  = false
            CoreAC.vehicleSpeed    = 0.0
        end

        CoreAC.playerInvincible  = GetPlayerInvincible(PlayerId())
        CoreAC.playerInvincible2 = GetPlayerInvincible_2(PlayerId())
        CoreAC.entityCanBeDamaged= GetEntityCanBeDamaged(ped)
        CoreAC.isVisible         = IsEntityVisible(ped)

        -- Attached to player kontrol
        local attached = IsEntityAttached(ped)
        if attached then
            local attachEnt = GetEntityAttachedTo(ped)
            CoreAC.isAttachedToAPlayer = attachEnt ~= 0 and GetEntityType(attachEnt) == 1
        else
            CoreAC.isAttachedToAPlayer = false
        end

        -- Heartbeat zaman damgası güncelle
        CoreAC.lastActorLoopTime = GetGameTimer()

        Wait(250)
    end
end)

-- ---------------------------------------------------------------------------
-- StrikesSystem — modules noclip.lua, godMode.lua, entityCreating.lua vb.
-- Strike sistemi: belirli sayıda "strike" oluşunca callback çalıştırır.
-- ---------------------------------------------------------------------------
CoreAC.StrikesSystem = {}

function CoreAC.StrikesSystem.createStrikeSystem(name, maxStrikes, callback, resetMs)
    local strikes = 0
    local lastStrike = 0
    local resetInterval = resetMs or 10000

    return function(...)
        local now = GetGameTimer()
        if now - lastStrike > resetInterval then
            strikes = 0
        end
        strikes = strikes + 1
        lastStrike = now

        if strikes >= maxStrikes then
            strikes = 0
            if type(callback) == 'function' then
                callback(...)
            end
        end
    end
end

-- ---------------------------------------------------------------------------
-- RegisterDetection — modules'un detection kayıt sistemi
-- CoreAC.RegisterDetection(name, fn, intervalMs) → periyodik döngü
-- ---------------------------------------------------------------------------
local registeredDetections = {}

function CoreAC.RegisterDetection(name, fn, intervalMs)
    if registeredDetections[name] then return end
    registeredDetections[name] = true
    intervalMs = intervalMs or 1000

    CreateThread(function()
        -- Spawn'u bekle
        while not CoreAC.playerSpawned do Wait(500) end
        Wait(math.random(500, 2000))  -- stagger

        while true do
            Wait(intervalMs)
            if CoreAC.playerSpawned and not CoreAC.isPlayerDead then
                local ok, err = pcall(fn)
                if not ok and Config and Config.Debug then
                    print(('[Aeigs-AC] Detection hata [%s]: %s'):format(name, tostring(err)))
                end
            end
        end
    end)
end

-- ---------------------------------------------------------------------------
-- Kural Senkronizasyonu — web panelden gelen kuralları CoreAC.Config'e uygula
-- ---------------------------------------------------------------------------
RegisterNetEvent('aeigs:rules', function(r)
    if type(r) ~= 'table' then return end

    local ruleMap = {
        anti_noclip            = 'AntiNoClip',
        anti_flyhack           = 'AntiFly',
        anti_speedhack         = 'AntiSpeedHack',
        anti_teleport          = 'AntiTeleport',
        anti_superjump         = 'AntiSuperJump',
        anti_vehicle_speed     = 'AntiVehicleSpeed',
        anti_vehicle_noclip    = 'AntiVehicleNoClip',
        anti_aimbot            = 'AntiAimbot',
        anti_silent_aim        = 'AntiSilentAim',
        anti_infinite_ammo     = 'AntiInfiniteAmmo',
        anti_no_reload         = 'AntiNoReload',
        anti_damage_multiplier = 'AntiDamageMultiplier',
        anti_explosive_bullets = 'AntiExplosiveBullets',
        anti_explosion_spam    = 'AntiExplosionSpam',
        anti_godmode           = 'AntiInvincible',
        anti_vehicle_godmode   = 'AntiVehicleGodmode',
        anti_illegal_vehicle   = 'AntiIllegalVehicle',
        anti_illegal_ped       = 'AntiIllegalPed',
        anti_illegal_object    = 'AntiIllegalObject',
        anti_give_all_weapons  = 'AntiGiveAllWeapons',
    }

    for aeigs_key, coreac_key in pairs(ruleMap) do
        if r[aeigs_key] ~= nil then
            CoreAC.Config.Main[coreac_key] = (r[aeigs_key] == true)
        end
    end
end)

-- ---------------------------------------------------------------------------
-- Server'dan gelen CoreAC event'leri
-- ---------------------------------------------------------------------------
RegisterNetEvent('__CoreAC:hasTeleported', function()
    CoreAC.hasTeleported = true
    CreateThread(function()
        Wait(5000)
        CoreAC.hasTeleported = false
    end)
end)

RegisterNetEvent('__CoreAC:hasChangedPedModel', function(model)
    CoreAC.hasChangedPedModel = true
    CreateThread(function()
        Wait(5000)
        CoreAC.hasChangedPedModel = false
    end)
end)

RegisterNetEvent('__CoreAC:isInvincible', function(toggle)
    CoreAC.isInvincible = toggle
end)

RegisterNetEvent('__CoreAC:hasAddedAmmo', function()
    -- ammo eklendi, modules ammo detection için kullanır
end)

print('^2[Aeigs-CoreAC Bridge] Client bridge yuklendi.^7')
