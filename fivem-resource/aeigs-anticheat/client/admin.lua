-- Core Shield Anti-Cheat — oyun içi yönetici menüsü (komut tabanlı) + aksiyon alıcıları
-- İzinler webden verilir; sunucu her aksiyonda izni doğrular (client sadece arayüz).

local myPerms = {}

local PERM_HELP = {
  kick = '/ac kick [id] [sebep]',
  ban = '/ac ban [id] [sebep]',
  warn = '/ac warn [id] [sebep]',
  spectate = '/ac spectate [id]',
  revive = '/ac revive [id]',
  tp = '/ac tp [id]',
  bring = '/ac bring [id]',
  freeze = '/ac freeze [id] on|off',
  announce = '/ac announce [mesaj]',
  screenshot = '/ac ss [id]',
}

local function notify(msg)
  SetNotificationTextEntry('STRING')
  AddTextComponentSubstringPlayerName(msg)
  DrawNotification(false, true)
end

local function has(perm) return myPerms[perm] == true end

-- Sunucudan izinler geldi
RegisterNetEvent('aeigs:perms', function(list)
  myPerms = {}
  for _, p in ipairs(list or {}) do myPerms[p] = true end
end)

RegisterNetEvent('aeigs:notify', function(msg) notify(msg) end)

-- Menü: /ac (izinli komutları listeler) veya /ac <komut> ...
RegisterCommand(Config.AdminCommand or 'ac', function(_, args)
  TriggerServerEvent('aeigs:requestPerms')
  Wait(150)
  local cmd = args[1]
  if not cmd then
    local lines = { '~b~— Core Shield Yönetici Menüsü —' }
    local any = false
    for perm, help in pairs(PERM_HELP) do
      if has(perm) then lines[#lines + 1] = '~w~' .. help; any = true end
    end
    if not any then lines[#lines + 1] = '~r~Yetkiniz yok.' end
    notify(table.concat(lines, '\n'))
    return
  end

  local id = tonumber(args[2])
  if cmd == 'kick' and has('kick') then
    TriggerServerEvent('aeigs:adminAction', 'kick', id, table.concat(args, ' ', 3))
  elseif cmd == 'ban' and has('ban') then
    TriggerServerEvent('aeigs:adminAction', 'ban', id, table.concat(args, ' ', 3))
  elseif cmd == 'warn' and has('warn') then
    TriggerServerEvent('aeigs:adminAction', 'warn', id, table.concat(args, ' ', 3))
  elseif cmd == 'revive' and has('revive') then
    TriggerServerEvent('aeigs:adminAction', 'revive', id)
  elseif cmd == 'tp' and has('tp') then
    TriggerServerEvent('aeigs:adminAction', 'tp', id)
  elseif cmd == 'bring' and has('bring') then
    TriggerServerEvent('aeigs:adminAction', 'bring', id)
  elseif cmd == 'spectate' and has('spectate') then
    TriggerServerEvent('aeigs:adminAction', 'spectate', id)
  elseif cmd == 'freeze' and has('freeze') then
    TriggerServerEvent('aeigs:adminAction', 'freeze', id, args[3] or 'on')
  elseif cmd == 'announce' and has('announce') then
    TriggerServerEvent('aeigs:adminAction', 'announce', nil, table.concat(args, ' ', 2))
  elseif cmd == 'ss' and has('screenshot') then
    TriggerServerEvent('aeigs:adminAction', 'screenshot', id)
  else
    notify('~r~Geçersiz komut veya yetki yok.')
  end
end, false)

-- İzinler değişince menüyü baştan iste
CreateThread(function()
  Wait(3000)
  TriggerServerEvent('aeigs:requestPerms')
end)

-- ---------------------------------------------------------------------------
-- Aksiyon alıcıları
-- ---------------------------------------------------------------------------
RegisterNetEvent('aeigs:revive', function()
  local ped = PlayerPedId()
  local c = GetEntityCoords(ped)
  NetworkResurrectLocalPlayer(c.x, c.y, c.z, GetEntityHeading(ped), true, false)
  SetEntityHealth(ped, 200)
  ClearPedBloodDamage(ped)
  notify('~g~Canlandırıldınız.')
end)

RegisterNetEvent('aeigs:freeze', function(state)
  local ped = PlayerPedId()
  FreezeEntityPosition(ped, state == true)
  notify(state and '~b~Donduruldunuz.' or '~b~Çözüldünüz.')
end)

RegisterNetEvent('aeigs:teleport', function(x, y, z)
  if Aeigs and Aeigs.markTp then Aeigs.markTp() end  -- yetkili ışınlama → tespit muaf
  local ped = PlayerPedId()
  SetEntityCoords(ped, x + 0.0, y + 0.0, z + 1.0, false, false, false, false)
  notify('~b~Işınlandınız.')
end)

RegisterNetEvent('aeigs:spectate', function(targetId, x, y, z)
  if Aeigs and Aeigs.markTp then Aeigs.markTp() end
  if Aeigs and Aeigs.markSpectate then Aeigs.markSpectate(tonumber(targetId) ~= 0) end  -- yetkili spectate muaf
  local ped = PlayerPedId()
  SetEntityCoords(ped, x + 0.0, y + 0.0, z + 30.0, false, false, false, false)
  NetworkSetInSpectatorMode(true, GetPlayerPed(GetPlayerFromServerId(tonumber(targetId))))
  notify('~b~İzleme modu açık — kapatmak için: /ac spectate 0')
  if tonumber(targetId) == 0 then NetworkSetInSpectatorMode(false, ped) end
end)
