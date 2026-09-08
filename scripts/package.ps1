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
    Copy-Item -LiteralPath $Src -Destination $Dest -Force -ErrorAction Stop
    if ((Get-FileHash -LiteralPath $Src).Hash -ne (Get-FileHash -LiteralPath $Dest).Hash) {
        throw "Package hash mismatch: $Dest"
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

Write-Host "Paketler hazirlandi."
Get-ChildItem -Path "$root\dist" | Select-Object Name, Length, LastWriteTime
