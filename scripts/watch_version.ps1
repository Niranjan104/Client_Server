param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [int]$DurationSeconds = 180,

  [int]$IntervalMilliseconds = 1000
)

$url = "{0}/api/version" -f $BaseUrl.TrimEnd('/')
$stopAt = (Get-Date).AddSeconds($DurationSeconds)
$lastSignature = ""
$flipCount = 0
$failureCount = 0
$successCount = 0

Write-Host "Watching $url for ${DurationSeconds}s" -ForegroundColor Cyan

while ((Get-Date) -lt $stopAt) {
  $timestamp = Get-Date -Format "HH:mm:ss"

  try {
    $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
    $slot = if ($null -ne $response.slot -and [string]$response.slot -ne "") {
      [string]$response.slot
    } elseif ($null -ne $response.version -and [string]$response.version -ne "") {
      [string]$response.version
    } else {
      "unknown"
    }

    $build = if ($null -ne $response.build) {
      [string]$response.build
    } else {
      ""
    }
    $signature = "$slot|$build"

    if ($lastSignature -and $lastSignature -ne $signature) {
      $flipCount++
      Write-Host "[$timestamp] Slot/build changed to $signature" -ForegroundColor Yellow
    } else {
      Write-Host "[$timestamp] slot=$slot build=$build" -ForegroundColor Green
    }

    $lastSignature = $signature
    $successCount++
  } catch {
    $failureCount++
    Write-Host "[$timestamp] request failed" -ForegroundColor Red
  }

  Start-Sleep -Milliseconds $IntervalMilliseconds
}

Write-Host ""
Write-Host "Watch complete." -ForegroundColor Green
Write-Host "Successful polls : $successCount"
Write-Host "Failed polls     : $failureCount"
Write-Host "Observed flips   : $flipCount"
