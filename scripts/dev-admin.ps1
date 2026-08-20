# Anticore dev ortamı — YÖNETİCİ modu (motor çalışır; WinDivert için şart)
# Panel-görüntüleme modu için: scripts/dev.ps1
$root = Split-Path -Parent $PSScriptRoot
$winlibs = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin"

$env:Path = "$env:USERPROFILE\.cargo\bin;$winlibs;$env:Path"
Set-Location "$root\desktop"
npm run tauri dev
