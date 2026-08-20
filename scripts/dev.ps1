# Anticore geliştirme ortamı — panel-görüntüleme modu (yöneticisiz)
# Tam motor için: scripts/dev-admin.ps1 (UAC onayı gerekir)
$root = Split-Path -Parent $PSScriptRoot
$winlibs = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin"
$env:ANTICORE_NO_ADMIN = "1"
$env:Path = "$env:USERPROFILE\.cargo\bin;$winlibs;$env:Path"
Set-Location "$root\desktop"
npm run tauri dev
