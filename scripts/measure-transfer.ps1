[CmdletBinding(DefaultParameterSetName = 'Measure')]
param(
    [Parameter(Mandatory, ParameterSetName = 'Measure')][uri]$Url,
    [Parameter(Mandatory, ParameterSetName = 'Measure')][ValidateSet('baseline', 'engine')][string]$Mode,
    [Parameter(Mandatory, ParameterSetName = 'Measure')][ValidateSet('download', 'upload')][string]$Direction,
    [Parameter(Mandatory, ParameterSetName = 'Measure')][ValidateRange(1, 1000)][int]$Pair,
    [Parameter(ParameterSetName = 'Measure')][string]$UploadFile,
    [Parameter(ParameterSetName = 'Measure')][string]$Profile = 'universal',
    [Parameter(ParameterSetName = 'Measure')][ValidateRange(20, 300)][int]$TimeoutSeconds = 120,
    [Parameter(Mandatory, ParameterSetName = 'Compare')][string[]]$Reports,
    [Parameter(Mandatory)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath $OutputPath) { throw 'Output already exists; choose a new report path.' }

function Get-Median([double[]]$Values) {
    $sorted = @($Values | Sort-Object)
    $mid = [int][math]::Floor($sorted.Count / 2)
    if ($sorted.Count % 2) { return $sorted[$mid] }
    return ($sorted[$mid - 1] + $sorted[$mid]) / 2
}

if ($PSCmdlet.ParameterSetName -eq 'Compare') {
    $rows = @($Reports | ForEach-Object { Get-Content -Raw -LiteralPath $_ | ConvertFrom-Json })
    if ($rows.Count -lt 10) { throw 'At least five baseline/engine pairs are required.' }
    foreach ($row in $rows) {
        foreach ($field in @('bytes', 'seconds', 'connectSeconds')) {
            if ($null -eq $row.$field -or [double]::IsNaN([double]$row.$field) -or [double]::IsInfinity([double]$row.$field) -or [double]$row.$field -lt 0) {
                throw 'Invalid or incomplete numeric measurement.'
            }
        }
    }
    if (@($rows | Where-Object { $_.schema -ne 1 -or $_.valid -ne $true -or $_.seconds -lt 20 -or $_.bytes -le 0 -or $_.exitCode -ne 0 -or $_.status -lt 200 -or $_.status -ge 300 }).Count) {
        throw 'Invalid or incomplete measurement; comparison cannot pass.'
    }
    if (@($rows | Group-Object direction).Count -ne 1 -or @($rows | Group-Object url).Count -ne 1 -or @($rows | Group-Object profile).Count -ne 1) {
        throw 'Use one direction, endpoint and profile per comparison.'
    }
    $ratios = @(); $baseline = @(); $latencyDeltas = @()
    foreach ($group in ($rows | Group-Object pair)) {
        $a = @($group.Group | Where-Object mode -eq 'baseline')
        $b = @($group.Group | Where-Object mode -eq 'engine')
        if ($group.Count -ne 2 -or $a.Count -ne 1 -or $b.Count -ne 1) { throw 'Each pair needs exactly one baseline and one engine sample.' }
        $baseRate = [double]$a[0].bytes / [double]$a[0].seconds
        $engineRate = [double]$b[0].bytes / [double]$b[0].seconds
        $baseline += $baseRate
        $ratios += $engineRate / $baseRate
        $latencyDeltas += ([double]$b[0].connectSeconds - [double]$a[0].connectSeconds) * 1000
    }
    $median = Get-Median $baseline
    $spread = (($baseline | Measure-Object -Maximum).Maximum - ($baseline | Measure-Object -Minimum).Minimum) / $median
    $ratio = Get-Median $ratios
    $sortedDeltas = @($latencyDeltas | Sort-Object)
    $p95 = $sortedDeltas[[math]::Ceiling($sortedDeltas.Count * 0.95) - 1]
    $verdict = if ($spread -gt 0.05) { 'inconclusive' } elseif ($ratio -ge 0.97 -and $p95 -le 10) { 'pass' } else { 'fail' }
    $result = [ordered]@{ schema = 1; verdict = $verdict; pairs = $ratios.Count; throughputRatio = $ratio; baselineSpread = $spread; p95ConnectIncreaseMs = $p95; direction = $rows[0].direction; reports = $Reports }
} else {
    if ($Url.Scheme -ne 'https' -or $Url.UserInfo) { throw 'Use HTTPS without embedded credentials.' }
    $curl = (Get-Command curl.exe -ErrorAction Stop).Source
    $curlArgs = @('--silent', '--show-error', '--fail', '--proto', '=https', '--connect-timeout', '15', '--max-time', "$TimeoutSeconds", '--output', 'NUL', '--header', 'Cache-Control: no-cache', '--write-out', '%{json}')
    if ($Direction -eq 'upload') {
        if (!$UploadFile -or !(Test-Path -LiteralPath $UploadFile -PathType Leaf)) { throw 'Upload requires an existing non-sensitive test file.' }
        $curlArgs += @('--upload-file', (Resolve-Path -LiteralPath $UploadFile).Path)
    }
    $curlArgs += @('--url', $Url.AbsoluteUri)
    $started = [DateTime]::UtcNow.ToString('o')
    $raw = & $curl @curlArgs
    $exitCode = $LASTEXITCODE
    $sample = $raw | ConvertFrom-Json
    $bytes = if ($Direction -eq 'upload') { [double]$sample.size_upload } else { [double]$sample.size_download }
    $seconds = [double]$sample.time_total
    $valid = $exitCode -eq 0 -and $sample.http_code -ge 200 -and $sample.http_code -lt 300 -and $bytes -gt 0 -and $seconds -ge 20
    $result = [ordered]@{
        schema = 1; mode = $Mode; direction = $Direction; pair = $Pair; profile = $Profile
        startedUtc = $started; url = $Url.AbsoluteUri; os = [Environment]::OSVersion.VersionString
        bytes = $bytes; seconds = $seconds; connectSeconds = [double]$sample.time_connect
        mbps = if ($seconds -gt 0) { $bytes * 8 / $seconds / 1000000 } else { 0 }
        status = $sample.http_code; exitCode = $exitCode; valid = $valid
        note = 'Mode is operator-labelled; verify engine state independently. Transfer duration must be at least 20 seconds.'
    }
}
$result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $OutputPath -Encoding utf8
$result
