$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backup = Join-Path $root ('package-backups\' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null

# 1. Klasorleri garanti et
New-Item -ItemType Directory -Force -Path "$root\bin" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\dist" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\dist-portable\Anticore\bin" | Out-Null

function Safe-Replace-Exe {
    param([string]$Src, [string]$Dest)
    if (Test-Path -LiteralPath $Dest) {
        $relative = [IO.Path]::GetRelativePath($root, $Dest).Replace('\', '_')
        Copy-Item -LiteralPath $Dest -Destination (Join-Path $backup $relative) -ErrorAction Stop
    }
    Copy-Item -LiteralPath $Src -Destination $Dest -Force -ErrorAction Stop
    if (Test-Path -LiteralPath "$Dest.sig") {
        $signatureBackup = [IO.Path]::GetRelativePath($root, "$Dest.sig").Replace('\', '_')
        Move-Item -LiteralPath "$Dest.sig" -Destination (Join-Path $backup $signatureBackup) -ErrorAction Stop
    }
    if ((Get-FileHash -LiteralPath $Src).Hash -ne (Get-FileHash -LiteralPath $Dest).Hash) {
        throw "Package hash mismatch: $Dest"
    }
}

# 2. GUI Ikilisini Kopyala
$gui = "$root\desktop\src-tauri\target\release\anticore-desktop.exe"
Safe-Replace-Exe $gui "$root\Anticore.exe"
Safe-Replace-Exe $gui "$root\anticore-desktop.exe"
Safe-Replace-Exe $gui "$root\dist\Anticore.exe"
Safe-Replace-Exe $gui "$root\dist-portable\Anticore\Anticore.exe"

# 3. CLI Motor Ikilisini Kopyala
$cli = "$root\engine\target\release\anticore.exe"
Safe-Replace-Exe $cli "$root\anticore-cli.exe"
Safe-Replace-Exe $cli "$root\bin\anticore.exe"
Safe-Replace-Exe $cli "$root\dist\anticore-cli.exe"
Safe-Replace-Exe $cli "$root\dist-portable\Anticore\anticore-cli.exe"
Safe-Replace-Exe $cli "$root\dist-portable\Anticore\bin\anticore.exe"

function Safe-Copy {
    param([string]$Src, [string]$Dest)
    if (Test-Path -LiteralPath $Dest) {
        if ((Get-FileHash -LiteralPath $Src).Hash -eq (Get-FileHash -LiteralPath $Dest).Hash) {
            return
        }
    }
    Copy-Item -LiteralPath $Src -Destination $Dest -Force -ErrorAction Stop
    if ((Get-FileHash -LiteralPath $Src).Hash -ne (Get-FileHash -LiteralPath $Dest).Hash) {
        throw "Package hash mismatch: $Dest"
    }
}

# 4. Surucu ve DLL Dosyalarini Esitle
$vendorWin = "$root\vendor\windows"
$winDivertDll = if (Test-Path "$vendorWin\WinDivert.dll") { "$vendorWin\WinDivert.dll" } else { "$root\WinDivert.dll" }
$winDivertSys = if (Test-Path "$vendorWin\WinDivert64.sys") { "$vendorWin\WinDivert64.sys" } else { "$root\WinDivert64.sys" }
$webView2Dll  = if (Test-Path "$vendorWin\WebView2Loader.dll") { "$vendorWin\WebView2Loader.dll" } else { "$root\WebView2Loader.dll" }

Safe-Copy $winDivertDll "$root\bin\WinDivert.dll"
Safe-Copy $winDivertSys "$root\bin\WinDivert64.sys"
Safe-Copy $winDivertDll "$root\dist\WinDivert.dll"
Safe-Copy $winDivertSys "$root\dist\WinDivert64.sys"
Safe-Copy $webView2Dll  "$root\dist\WebView2Loader.dll"
Safe-Copy $winDivertDll "$root\dist-portable\Anticore\WinDivert.dll"
Safe-Copy $winDivertSys "$root\dist-portable\Anticore\WinDivert64.sys"
Safe-Copy $webView2Dll  "$root\dist-portable\Anticore\WebView2Loader.dll"
Safe-Copy $winDivertDll "$root\dist-portable\Anticore\bin\WinDivert.dll"
Safe-Copy $winDivertSys "$root\dist-portable\Anticore\bin\WinDivert64.sys"

$packageJson = Get-Content "$root\desktop\package.json" -Raw | ConvertFrom-Json
$ver = $packageJson.version

# 5. Kurulum Paketlerini Kopyala
$nsis = "$root\desktop\src-tauri\target\release\bundle\nsis\Anticore_${ver}_x64-setup.exe"
if (-not (Test-Path $nsis)) {
    $nsis = "$root\desktop\src-tauri\target\release\bundle\nsis\Anticore_0.3.1_x64-setup.exe"
}
if (Test-Path $nsis) {
    if ((Get-Item $nsis).LastWriteTimeUtc -lt (Get-Item "$root\desktop\dist\index.html").LastWriteTimeUtc) { throw 'NSIS installer is stale; rebuild it first' }
    Safe-Replace-Exe $nsis "$root\dist\Anticore_${ver}_x64-setup.exe"
}
$msi = "$root\desktop\src-tauri\target\release\bundle\msi\Anticore_${ver}_x64_en-US.msi"
if (-not (Test-Path $msi)) {
    $msi = "$root\desktop\src-tauri\target\release\bundle\msi\Anticore_0.3.1_x64_en-US.msi"
}
if (Test-Path $msi) {
    if ((Get-Item $msi).LastWriteTimeUtc -lt (Get-Item "$root\desktop\dist\index.html").LastWriteTimeUtc) { throw 'MSI installer is stale; rebuild it first' }
    Safe-Replace-Exe $msi "$root\dist\Anticore_${ver}_x64_en-US.msi"
}

# 6. Portable ZIP Paketi Olustur
$zipTarget = "$root\dist-portable\Anticore_${ver}_x64-portable.zip"
$zipStaging = Join-Path $backup 'new-portable.zip'
Compress-Archive -Path "$root\dist-portable\Anticore\*" -DestinationPath $zipStaging -CompressionLevel Optimal
Safe-Replace-Exe $zipStaging $zipTarget
Safe-Replace-Exe $zipStaging "$root\dist\Anticore_${ver}_x64-portable.zip"

Write-Host "Paketler hazirlandi."
Get-ChildItem -Path "$root\dist" | Select-Object Name, Length, LastWriteTime
