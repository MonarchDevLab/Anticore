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
        $relative = $Dest.Replace($root, '').TrimStart('\').Replace('\', '_')
        Copy-Item -LiteralPath $Dest -Destination (Join-Path $backup $relative) -ErrorAction Stop
    }
    Copy-Item -LiteralPath $Src -Destination $Dest -Force -ErrorAction Stop
    if (Test-Path -LiteralPath "$Dest.sig") {
        $signatureBackup = ("$Dest.sig").Replace($root, '').TrimStart('\').Replace('\', '_')
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

Safe-Copy $winDivertDll "$root\WinDivert.dll"
Safe-Copy $winDivertSys "$root\WinDivert64.sys"
Safe-Copy $webView2Dll  "$root\WebView2Loader.dll"
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
if (Test-Path $nsis) {
    if ((Get-Item $nsis).LastWriteTimeUtc -lt (Get-Item "$root\desktop\dist\index.html").LastWriteTimeUtc) { throw 'NSIS installer is stale; rebuild it first' }
    Safe-Replace-Exe $nsis "$root\dist\Anticore_${ver}_x64-setup.exe"
}
$msi = "$root\desktop\src-tauri\target\release\bundle\msi\Anticore_${ver}_x64_en-US.msi"
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

# 7. Tauri Minisign (.sig) ve latest.json OTA Manifest Uretimi
$keyFile = "$root\keys\anticore.key"
if (Test-Path -LiteralPath $keyFile) {
    Write-Host "OTA paketleri imzalaniyor ve latest.json uretiliyor..."
    $setupDest = "$root\dist\Anticore_${ver}_x64-setup.exe"
    $msiDest   = "$root\dist\Anticore_${ver}_x64_en-US.msi"
    $sigSetup  = ""
    $sigMsi    = ""

    if (Test-Path -LiteralPath $setupDest) {
        Push-Location "$root\desktop"
        try {
            cmd.exe /c "npm run tauri -- signer sign -f ../keys/anticore.key -p `"`" `"$setupDest`"" | Out-Null
        } finally {
            Pop-Location
        }
        if (Test-Path -LiteralPath "$setupDest.sig") {
            $sigSetup = (Get-Content -LiteralPath "$setupDest.sig" -Raw).Trim()
        }
    }

    if (Test-Path -LiteralPath $msiDest) {
        Push-Location "$root\desktop"
        try {
            cmd.exe /c "npm run tauri -- signer sign -f ../keys/anticore.key -p `"`" `"$msiDest`"" | Out-Null
        } finally {
            Pop-Location
        }
        if (Test-Path -LiteralPath "$msiDest.sig") {
            $sigMsi = (Get-Content -LiteralPath "$msiDest.sig" -Raw).Trim()
        }
    }

    $baseUrl = "https://github.com/MonarchDevLab/Anticore/releases/download/v$ver"
    $platforms = [ordered]@{}
    if ($sigSetup) {
        $platforms["windows-x86_64"] = [ordered]@{
            signature = $sigSetup
            url       = "$baseUrl/Anticore_${ver}_x64-setup.exe"
        }
        $platforms["windows-x86_64-nsis"] = [ordered]@{
            signature = $sigSetup
            url       = "$baseUrl/Anticore_${ver}_x64-setup.exe"
        }
    }
    if ($sigMsi) {
        $platforms["windows-x86_64-msi"] = [ordered]@{
            signature = $sigMsi
            url       = "$baseUrl/Anticore_${ver}_x64_en-US.msi"
        }
    }

    $manifest = [ordered]@{
        version   = $ver
        notes     = "Anticore v$ver - Multi-platform OTA update hardening, mandatory broadcast shield & kernel driver stability."
        pub_date  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        platforms = $platforms
    }
    $manifestJson = $manifest | ConvertTo-Json -Depth 5
    Set-Content -LiteralPath "$root\dist\latest.json" -Value $manifestJson -Encoding UTF8
}

Write-Host "Paketler hazirlandi."
Get-ChildItem -Path "$root\dist" | Select-Object Name, Length, LastWriteTime
