local noRagdollStrike = CoreAC.StrikesSystem.createStrikeSystem(
    "AntiNoRagdoll",
    2,
    function(playerId)
        CoreAC.DetectPlayer(CoreAC.Detections.ANTI_NO_RAGDOLL)
    end,
    15000
)

local checkNoRagdoll = LPH_JIT_MAX(function()
    if not CoreAC.Config.Main.AntiNoRagdoll then
        return
    end

    if CanPedRagdoll(CoreAC.playerPed) ~= 1 and
        not CoreAC.isPlayerInVehicle and
        CoreAC.isPlayerFreeForAmbientTask and
        not CoreAC.isPlayerDead and
        not CoreAC.isPedJumpingOutOfVehicle and
        not IsPedJacking(CoreAC.playerPed) and
        not CoreAC.isPedRunningRagdollTask and
        not IsEntityPositionFrozen(CoreAC.playerPed) and
        IsPlayerControlOn(CoreAC.playerId) and
        not IsEntityAttached(CoreAC.playerPed) and
        not CoreAC.hasChangedPedModel and
-- Zm1hLnd0ZiBldmVyeXdoZXJl
        not CoreAC.playerRevived and
        CoreAC.canPedRagdoll
    then
        noRagdollStrike()
    end
end)

CoreAC.RegisterDetection("noRagdoll", checkNoRagdoll, 5000)

exports("canRagdoll", LPH_NO_VIRTUALIZE(function(toggle)
    CoreAC.canPedRagdoll = NumberToBoolean(toggle)
end))
