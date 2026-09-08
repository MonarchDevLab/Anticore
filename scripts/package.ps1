$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# 1. Klasorleri garanti et
New-Item -ItemType Directory -Force -Path "$root\bin" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\dist-portable\Anticore\bin" | Out-Null

# 2. GUI Ikilisini Kopyala
$gui = "$root\desktop\src-tauri\target\release\anticore-desktop.exe"
Copy-Item $gui "$root\Anticore.exe" -Force
Copy-Item $gui "$root\anticore-desktop.exe" -Force
Copy-Item $gui "$root\dist\Anticore.exe" -Force
Copy-Item $gui "$root\dist-portable\Anticore\Anticore.exe" -Force

# 3. CLI Motor Ikilisini Kopyala
$cli = "$root\engine\target\release\anticore.exe"
Copy-Item $cli "$root\anticore-cli.exe" -Force
Copy-Item $cli "$root\bin\anticore.exe" -Force
Copy-Item $cli "$root\dist\anticore-cli.exe" -Force
Copy-Item $cli "$root\dist-portable\Anticore\anticore-cli.exe" -Force
Copy-Item $cli "$root\dist-portable\Anticore\bin\anticore.exe" -Force

function Safe-Copy {
    param([string]$Src, [string]$Dest)
    try {
        Copy-Item $Src $Dest -Force -ErrorAction Stop
    } catch {
        if (-not (Test-Path $Dest)) {
            throw $_
        }
    }
}

# 4. Surucu ve DLL Dosyalarini Esitle
Safe-Copy "$root\WinDivert.dll" "$root\bin\WinDivert.dll"
Safe-Copy "$root\WinDivert64.sys" "$root\bin\WinDivert64.sys"
Safe-Copy "$root\WinDivert.dll" "$root\dist\WinDivert.dll"
Safe-Copy "$root\WinDivert64.sys" "$root\dist\WinDivert64.sys"
Safe-Copy "$root\WebView2Loader.dll" "$root\dist\WebView2Loader.dll"
Safe-Copy "$root\WinDivert.dll" "$root\dist-portable\Anticore\WinDivert.dll"
Safe-Copy "$root\WinDivert64.sys" "$root\dist-portable\Anticore\WinDivert64.sys"
Safe-Copy "$root\WebView2Loader.dll" "$root\dist-portable\Anticore\WebView2Loader.dll"
Safe-Copy "$root\WinDivert.dll" "$root\dist-portable\Anticore\bin\WinDivert.dll"
Safe-Copy "$root\WinDivert64.sys" "$root\dist-portable\Anticore\bin\WinDivert64.sys"

$packageJson = Get-Content "$root\desktop\package.json" -Raw | ConvertFrom-Json
$ver = $packageJson.version

# 5. Kurulum Paketlerini Kopyala
$nsis = "$root\desktop\src-tauri\target\release\bundle\nsis\Anticore_${ver}_x64-setup.exe"
if (Test-Path $nsis) {
    Copy-Item $nsis "$root\dist\Anticore_${ver}_x64-setup.exe" -Force
}
$msi = "$root\desktop\src-tauri\target\release\bundle\msi\Anticore_${ver}_x64_en-US.msi"
if (Test-Path $msi) {
    Copy-Item $msi "$root\dist\Anticore_${ver}_x64_en-US.msi" -Force
}

# 6. Portable ZIP Paketi Olustur
$zipTarget = "$root\dist-portable\Anticore_${ver}_x64-portable.zip"
if (Test-Path $zipTarget) {
    Remove-Item $zipTarget -Force
}
Compress-Archive -Path "$root\dist-portable\Anticore\*" -DestinationPath $zipTarget -CompressionLevel Optimal
Copy-Item $zipTarget "$root\dist\Anticore_${ver}_x64-portable.zip" -Force

Write-Host "Paketler hazirlandi."
Get-ChildItem -Path "$root\dist" | Select-Object Name, Length, LastWriteTime
