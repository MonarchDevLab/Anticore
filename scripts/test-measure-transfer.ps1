$ErrorActionPreference = 'Stop'
$measure = Join-Path $PSScriptRoot 'measure-transfer.ps1'
$testDir = Join-Path ([IO.Path]::GetTempPath()) ('anticore-transfer-check-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $testDir | Out-Null
$reports = @()
foreach ($pair in 1..5) {
    foreach ($mode in @('baseline', 'engine')) {
        $path = Join-Path $testDir "$pair-$mode.json"
        @{ schema = 1; pair = $pair; mode = $mode; profile = 'test'; direction = 'download'; url = 'https://example.invalid/test'; bytes = 25000000; seconds = 25; connectSeconds = 0.01; status = 200; exitCode = 0; valid = $true } |
            ConvertTo-Json | Set-Content -LiteralPath $path
        $reports += $path
    }
}
$same = & $measure -Reports $reports -OutputPath (Join-Path $testDir 'same.json')
if ($same.verdict -ne 'pass' -or $same.throughputRatio -ne 1) { throw 'Equal transfers must pass.' }
foreach ($path in ($reports | Where-Object { $_ -like '*-engine.json' })) {
    $row = Get-Content -Raw -LiteralPath $path | ConvertFrom-Json
    $row.bytes = 20000000
    $row | ConvertTo-Json | Set-Content -LiteralPath $path
}
$slow = & $measure -Reports $reports -OutputPath (Join-Path $testDir 'slow.json')
if ($slow.verdict -ne 'fail' -or [math]::Abs($slow.throughputRatio - 0.8) -gt 0.0001) { throw '20 percent slowdown must fail.' }
$row = Get-Content -Raw -LiteralPath $reports[0] | ConvertFrom-Json
$row.bytes = 50000000
$row | ConvertTo-Json | Set-Content -LiteralPath $reports[0]
$noisy = & $measure -Reports $reports -OutputPath (Join-Path $testDir 'noisy.json')
if ($noisy.verdict -ne 'inconclusive') { throw 'Unstable baseline must not certify performance.' }
$row.valid = $false
$row | ConvertTo-Json | Set-Content -LiteralPath $reports[0]
$rejected = $false
try { & $measure -Reports $reports -OutputPath (Join-Path $testDir 'invalid.json') | Out-Null }
catch { $rejected = $_.Exception.Message -like '*Invalid or incomplete*' }
if (!$rejected) { throw 'Failed transfers must be rejected.' }
$rejected = $false
try { & $measure -Url 'http://example.invalid/test' -Mode baseline -Direction download -Pair 1 -OutputPath (Join-Path $testDir 'insecure.json') | Out-Null }
catch { $rejected = $_.Exception.Message -like '*Use HTTPS*' }
if (!$rejected) { throw 'Plain HTTP must be rejected before transfer.' }
Write-Output 'PASS: equal, slowdown, unstable baseline, failed sample, HTTPS validation. Synthetic fixtures only; no network performance claim.'
