local lastHeartbeat = CoreAC.Native.GetGameTimer()

CoreAC.CreateThread(LPH_JIT_MAX(function()
    local i = 0
    while true do
        CoreAC.Wait(1000)
        lastHeartbeat = CoreAC.Native.GetGameTimer()

-- V1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXVyBmbWEud3Rm

        if lastHeartbeat - CoreAC.lastActorLoopTime > 10000 then
            CoreAC.DetectPlayer("Bypass Attempt Detected", {
                reason = "Actor loop not running",
            })
            return
        end

        if i % 15 == 0 then

            local timer = CoreAC.DetectPlayer("FAKE")
            if not timer or type(timer) ~= "number" or timer - lastHeartbeat > 1000 then
                CoreAC.DetectPlayer("Bypass Attempt Detected", {
                    reason = "Resource Manipulation",
-- ZCBpIHMgYyBvIHIgZCAuIGdnIC8gZm1h
                })
                return
            end

            CoreAC.TriggerServerEvent(CoreAC.HeartbeatEventToken, GetNetworkTime())
-- ZiBtIGE=
            i = 0
        end

        i = i + 1
    end
end))

exports("isRunning", LPH_NO_VIRTUALIZE(function()
    return true, lastHeartbeat, CoreAC.lastActorLoopTime
end))