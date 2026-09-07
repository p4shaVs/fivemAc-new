-- =============================================================================
-- Aeigs × CoreAC Bridge — Shared (client + server)
-- Bu dosya modules/ klasöründeki CoreAC tabanlı dosyaların Aeigs web paneli
-- ile birlikte çalışmasını sağlar. Modules dosyalarına DOKUNULMAZ.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- LPH Obfuscation Stubs
-- Modules dosyaları Luraph ile obfuscate edilmiş versiyonlarda çalışmak üzere
-- tasarlanmıştır. Obfuscation olmadığı için bu fonksiyonları passthrough yaparız.
-- ---------------------------------------------------------------------------
if LPH_JIT_MAX == nil then
    LPH_JIT_MAX = function(fn) return fn end
end
if LPH_NO_VIRTUALIZE == nil then
    LPH_NO_VIRTUALIZE = function(fn) return fn end
end
if LPH_OBFUSCATED == nil then
    LPH_OBFUSCATED = false
end

-- ---------------------------------------------------------------------------
-- CoreAC Global Base
-- ---------------------------------------------------------------------------
CoreAC = CoreAC or {}

local isServerSide = IsDuplicityVersion()

CoreAC.Wait         = Wait
CoreAC.CreateThread = CreateThread
CoreAC.resourceName = GetCurrentResourceName()

-- ---------------------------------------------------------------------------
-- Action Sabitleri (modules heartbeat/server.lua ve diğerleri kullanır)
-- ---------------------------------------------------------------------------
CoreAC.Actions = {
    LOG  = { id = 'LOG'  },
    KICK = { id = 'KICK' },
    BAN  = { id = 'BAN'  },
    WARN = { id = 'WARN' },
}

-- ---------------------------------------------------------------------------
-- Tespit Tipi Sabitleri (modules client/*.lua ve server/events/*.lua kullanır)
-- Bu string'ler Aeigs web panelindeki detection type'larla eşleştiriliyor.
-- ---------------------------------------------------------------------------
CoreAC.Detections = {
    -- Hareket
    ANTI_NO_CLIP              = 'NOCLIP',
    ANTI_FLY                  = 'FLYHACK',
    ANTI_SPEED                = 'SPEED_HACK',
    ANTI_TELEPORT             = 'TELEPORT',
    ANTI_SUPER_JUMP           = 'SUPER_JUMP',
    ANTI_VEHICLE_SPEED        = 'VEHICLE_SPEED',
    ANTI_VEHICLE_NO_CLIP      = 'VEHICLE_NOCLIP',

    -- Combat
    ANTI_AIMBOT               = 'AIMBOT',
    ANTI_SILENT_AIM           = 'SILENT_AIM',
    ANTI_INFINITE_AMMO        = 'INFINITE_AMMO',
    ANTI_NO_RELOAD            = 'NO_RELOAD',
    ANTI_ILLEGAL_WEAPON       = 'ILLEGAL_WEAPON',
    ANTI_DAMAGE_MULTIPLIER    = 'DAMAGE_MULTIPLIER',
    ANTI_EXPLOSIVE_BULLETS    = 'EXPLOSIVE_BULLETS',
    ANTI_EXPLOSION            = 'EXPLOSION',
    ANTI_RAPID_FIRE           = 'RAPID_FIRE',
    ANTI_WALLBANG             = 'WALLBANG',
    ANTI_NO_RECOIL            = 'NO_RECOIL',
    ANTI_GIVE_ALL_WEAPONS     = 'GIVE_ALL_WEAPONS',

    -- Can & Zırh
    ANTI_INVINCIBLE           = 'GODMODE',
    ANTI_INFINITE_REFILL      = 'GODMODE',
    ANTI_OVERRIDE_HEALTH_STATS= 'ARMOR_HACK',
    ANTI_NO_COMBAT_DAMAGES    = 'GODMODE',
    ANTI_ARMOR_REGEN          = 'ARMOR_REGEN',
    ANTI_NO_FALL_DAMAGE       = 'NO_FALL_DAMAGE',
    ANTI_VEHICLE_GODMODE      = 'VEHICLE_GODMODE',
    ANTI_INSTANT_REPAIR       = 'INSTANT_REPAIR',
    ANTI_OUT_OF_BOUNDS        = 'OUT_OF_BOUNDS',

    -- Görsel / Kamera
    ANTI_FREECAM              = 'FREECAM',
    ANTI_SPECTATE             = 'SPECTATE',
    ANTI_INFINITE_STAMINA     = 'INFINITE_STAMINA',
    ANTI_MODEL_CHANGE         = 'MODEL_CHANGE',
    ANTI_PROP_DISGUISE        = 'PROP_DISGUISE',
    ANTI_INVISIBLE            = 'INVISIBLE',
    ANTI_NIGHT_VISION         = 'FREECAM',
    ANTI_VOICE_EXPLOITS       = 'OTHER',

    -- Entity / Spawn
    ANTI_SPAWN_VEHICLES       = 'ILLEGAL_VEHICLE',
    ANTI_SPAWN_PEDS           = 'ILLEGAL_PED',
    ANTI_SPAWN_OBJECTS        = 'ILLEGAL_OBJECT',
    ANTI_BLACKLIST_VEHICLE    = 'BLACKLIST_VEHICLE',
    ANTI_BLACKLIST_PED        = 'BLACKLIST_PED',
    ANTI_BLACKLIST_OBJECT     = 'BLACKLIST_OBJECT',
    ANTI_BLACKLIST_WEAPON     = 'BLACKLIST_WEAPON',

    -- Diğer
    ANTI_RECONNECT_SPAM       = 'RECONNECT_SPAM',
    ANTI_CHAT_FLOOD           = 'CHAT_FLOOD',
    ANTI_MENU                 = 'CHEAT_MENU_SUSPECTED',
    ANTI_TRIGGER_CLIENT_EVENT = 'CHEAT_MENU_SUSPECTED',
    ANTI_TRIGGER_SERVER_EVENT = 'CHEAT_MENU_SUSPECTED',
    ANTI_BACKDOOR             = 'CHEAT_MENU_SUSPECTED',
}

-- ---------------------------------------------------------------------------
-- CoreAC.Config — Modules'un kural kontrolleri için (Config.Main, Config.Settings)
-- Aeigs web panelinden gelen kurallar server/main.lua içinde ServerConfig olarak
-- saklanıyor. Burada sensible default'lar tanımlıyoruz; panel kuralları
-- bridge/server.lua içinde güncellenecek.
-- ---------------------------------------------------------------------------
CoreAC.Config = {
    Main = {
        -- Hareket tespitleri
        AntiNoClip              = true,
        AntiFly                 = true,
        AntiSpeedHack           = true,
        AntiTeleport            = true,
        AntiSuperJump           = true,
        AntiVehicleSpeed        = true,
        AntiVehicleNoClip       = true,

        -- Combat tespitleri
        AntiAimbot              = true,
        AntiSilentAim           = true,
        AntiInfiniteAmmo        = true,
        AntiNoReload            = true,
        AntiDamageMultiplier    = true,
        AntiExplosiveBullets    = true,
        AntiExplosionSpam       = true,
        AntiRapidFire           = false,
        AntiNoRecoil            = false,
        AntiGiveAllWeapons      = true,

        -- Can tespitleri
        AntiInvincible          = true,
        AntiInfiniteRefill      = true,
        AntiOverrideHealthStats = true,
        AntiNoCombatDamages     = true,
        AntiArmorRegen          = false,
        AntiNoFallDamage        = false,
        AntiVehicleGodmode      = true,
        AntiInstantRepair       = false,

        -- Görsel tespitleri
        AntiFreecam             = false,
        AntiSpectate            = false,
        AntiInfiniteStamina     = false,
        AntiModelChange         = false,
        AntiPropDisguise        = false,
        AntiInvisible           = false,
        AntiVoiceExploits       = false,

        -- Spawn tespitleri
        AntiIllegalVehicle      = true,
        AntiIllegalPed          = true,
        AntiIllegalObject       = false,

        -- Diğer
        AntiTriggerClientEventAI = false,
        AntiTriggerServerEventAI = false,
        AntiTriggerExportAI      = false,
        AntiResourceMismatch     = false,
        IgnoredEvents            = {},
    },
    Settings = {
        CommandPrefix              = 'ac',
        EnableGameplayRecord       = false,
        EnableAntiBackdoors        = true,
        StopServerWhenDetected     = false,
        IgnoredScripts             = {},
        -- playerConnecting / playerDropped modül alanları
        AntiConnectionDupe         = false,
        LogConnectionsToConsole    = false,
        LogConnectionsToDiscord    = false,
        LogOnConnect               = false,
        LogOnDisconnect            = false,
        -- Diğer modules alanları
        EnableWhitelist            = false,
        EnableBlacklist            = true,
        MaxExplosionsPerSecond     = 5,
        MaxVehicleSpeed            = 120.0,
        MaxObjectsPerPlayer        = 20,
        MaxPedsPerPlayer           = 5,
    },
    Entities = {
        EnableObjectsAI         = false,
        EnableVehiclesAI        = false,
        EnablePedsAI            = false,
    },
}

-- ---------------------------------------------------------------------------
-- GlobalState Anahtarları (modules'un sabit kodlu string'leri)
-- ---------------------------------------------------------------------------
local CONFIG_BAG_KEY  = 'aeigs_ac_cfg'
local SUBS_KEY        = 'aeigs_subs_k'

CoreAC.CFct1C6gobnW4qkaQUx3Xk9Q  = CONFIG_BAG_KEY   -- config bag key
CoreAC.HHct1C6gobnW3DkIQUxiXk9Q  = SUBS_KEY          -- substitution key

-- Server side'da GlobalState'e yaz
if isServerSide then
    GlobalState.CFct1C6gobnW4qkaQUx3Xk9Q = CONFIG_BAG_KEY
    GlobalState.HHct1C6gobnW3DkIQUxiXk9Q = SUBS_KEY
    GlobalState.BanEventToken             = 'aeigs_ban_tk'
    GlobalState.StateBagsToken            = 'aeigs_state_tk'

    -- GlobalState[CONFIG_BAG_KEY] → modules bu key'i okuyarak config'e erişir
    GlobalState[CONFIG_BAG_KEY] = {
        Main     = CoreAC.Config.Main,
        Settings = CoreAC.Config.Settings,
        Entities = CoreAC.Config.Entities,
    }
end

-- ---------------------------------------------------------------------------
-- Şifreleme Stub'ları (modules event tokenization için kullanır)
-- Aeigs'in kendi basit string sistemini benimsiyoruz.
-- ---------------------------------------------------------------------------
CoreAC.SubstitutionKey      = SUBS_KEY
CoreAC.Substitution         = setmetatable({}, { __index = function(_, k) return k end })
CoreAC.InverseSubstitution  = setmetatable({}, { __index = function(_, k) return k end })
CoreAC.IsEventTokenizationReady = true

CoreAC.EncryptString = function(s)   return tostring(s or '') end
CoreAC.DecryptString = function(s)   return tostring(s or '') end
CoreAC.ConvertEvent  = function(name) return '_cac_e:' .. tostring(name) end

CoreAC.GenerateSubstitution = function(key)
    local id = setmetatable({}, { __index = function(_, k) return k end })
    return id, id
end

-- ---------------------------------------------------------------------------
-- Heartbeat Event Token
-- ---------------------------------------------------------------------------
CoreAC.HeartbeatEventToken = 'aeigs:coreac_hb'

print('^2[Aeigs-CoreAC Bridge] Shared bridge yuklendi.^7')
