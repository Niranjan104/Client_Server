param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [string]$Path = "/api/menu",

  [int]$Concurrency = 25,

  [int]$DurationSeconds = 180,

  [int]$TimeoutSeconds = 15
)

$stopAt = (Get-Date).AddSeconds($DurationSeconds)
$targetUrl = ("{0}{1}" -f $BaseUrl.TrimEnd('/'), $Path)

Write-Host "Starting load test against $targetUrl" -ForegroundColor Cyan
Write-Host "Concurrency: $Concurrency | Duration: ${DurationSeconds}s | Timeout: ${TimeoutSeconds}s" -ForegroundColor Cyan

$worker = {
  param($Url, $StopAt, $TimeoutSeconds)

  $success = 0
  $failure = 0

  while ((Get-Date) -lt $StopAt) {
    try {
      $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        $success++
      } else {
        $failure++
      }
    } catch {
      $failure++
    }
  }

  [pscustomobject]@{
    Success = $success
    Failure = $failure
  }
}

$jobs = for ($i = 1; $i -le $Concurrency; $i++) {
  Start-Job -ScriptBlock $worker -ArgumentList $targetUrl, $stopAt, $TimeoutSeconds
}

Wait-Job $jobs | Out-Null
$results = $jobs | Receive-Job
$jobs | Remove-Job | Out-Null

$totalSuccess = ($results | Measure-Object -Property Success -Sum).Sum
$totalFailure = ($results | Measure-Object -Property Failure -Sum).Sum
$totalRequests = $totalSuccess + $totalFailure
$requestsPerSecond = if ($DurationSeconds -gt 0) { [math]::Round($totalRequests / $DurationSeconds, 2) } else { 0 }

Write-Host ""
Write-Host "Load test complete." -ForegroundColor Green
Write-Host "Successful requests : $totalSuccess"
Write-Host "Failed requests     : $totalFailure"
Write-Host "Total requests      : $totalRequests"
Write-Host "Approx requests/sec : $requestsPerSecond"
