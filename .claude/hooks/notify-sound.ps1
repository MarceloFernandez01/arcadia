$ErrorActionPreference = 'SilentlyContinue'
$raw = [Console]::In.ReadToEnd()
$msg = ''
try { $msg = ($raw | ConvertFrom-Json).message } catch {}
# Silenciar la notificación de inactividad (esperando input), no es atención real
if ($msg -like '*waiting for your input*') { exit 0 }
Add-Type -AssemblyName presentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([uri]'C:\Users\UsuarioCompuElite\Music\sfx-realization.wav')
$player.Play()
Start-Sleep -Seconds 4
