param([ValidateSet('CloseApps','Verify')][string]$Phase = 'Verify')
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$report = Join-Path $root "live-$Phase.txt"
$serviceCreated = $false
$child = $null
try {
    $admin = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Administrator required' }
    if ($Phase -eq 'CloseApps') {
        $allowed = @('Anticore.exe','anticore-desktop.exe','dist\Anticore.exe','dist-portable\Anticore\Anticore.exe','desktop\src-tauri\target\release\anticore-desktop.exe') | ForEach-Object { Join-Path $root $_ }
        Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -in $allowed } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop }
        'PASS: only workspace GUI processes closed' | Out-File -LiteralPath $report
        exit 0
    }
    if (Get-Service -Name AnticoreService -ErrorAction SilentlyContinue) { throw 'Existing service present; refusing to replace it' }
    $data = Join-Path $root 'live-test-data'
    New-Item -ItemType Directory -Path $data -Force | Out-Null
    $motor = Join-Path $root 'bin\anticore.exe'
    $out = Join-Path $data 'stdout.log'
    $err = Join-Path $data 'stderr.log'
    $child = Start-Process -FilePath $motor -ArgumentList @('run','--profile','universal','--data-dir',('"'+$data+'"')) -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
    $ready = $false
    for ($attempt = 0; $attempt -lt 50; $attempt++) {
        Start-Sleep -Milliseconds 100
        if ($child.HasExited) { throw "Detached exited: $(Get-Content -LiteralPath $err -Raw)" }
        if ((Get-Content -LiteralPath $out -Raw) -match '\[\+\] aktif\.') { $ready = $true; break }
    }
    if (-not $ready) { throw 'Detached readiness timeout' }
    Stop-Process -Id $child.Id -Force
    $child.WaitForExit()
    $child = $null
    'PASS: detached driver ready and process stopped' | Out-File -LiteralPath $report
    $binPath = '"'+$motor+'" service-run --profile universal --data-dir "'+$data+'"'
    $result = & sc.exe create AnticoreService binPath= $binPath start= demand 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Service create failed: $result" }
    $serviceCreated = $true
    Start-Service -Name AnticoreService
    (Get-Service AnticoreService).WaitForStatus('Running', [TimeSpan]::FromSeconds(10))
    Start-Sleep -Seconds 2
    if ((Get-Service AnticoreService).Status -ne 'Running') { throw 'Service stopped after startup' }
    Stop-Service -Name AnticoreService
    (Get-Service AnticoreService).WaitForStatus('Stopped', [TimeSpan]::FromSeconds(10))
    'PASS: service create/start/stable/stop' | Out-File -LiteralPath $report -Append
} catch {
    "FAIL: $_" | Out-File -LiteralPath $report -Append
    exit 1
} finally {
    if ($child -and -not $child.HasExited) { Stop-Process -Id $child.Id -Force }
    if ($serviceCreated) {
        Stop-Service AnticoreService -ErrorAction SilentlyContinue
        & sc.exe delete AnticoreService | Out-File -LiteralPath $report -Append
    }
}
