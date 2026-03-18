$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$pnpm = "pnpm.cmd"

$services = @(
  @{ Name = "web"; Port = 3000; Filter = "@xblog/web" },
  @{ Name = "admin"; Port = 3001; Filter = "@xblog/admin" },
  @{ Name = "api"; Port = 4000; Filter = "@xblog/api" }
)

$restartQueue = New-Object System.Collections.Generic.List[object]
$stoppedPids = @{}

function Invoke-Pnpm {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & $pnpm @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $pnpm $($Arguments -join ' ')"
  }
}

function Get-ListeningPid {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $connection = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -eq $Port } |
    Select-Object -First 1

  if (-not $connection) {
    return $null
  }

  return $connection.OwningProcess
}

foreach ($service in $services) {
  $listenerPid = Get-ListeningPid -Port $service.Port
  if (-not $listenerPid) {
    continue
  }

  if (-not $stoppedPids.ContainsKey($listenerPid)) {
    Stop-Process -Id $listenerPid -Force
    $stoppedPids[$listenerPid] = $true
  }

  $restartQueue.Add($service)
}

try {
  Invoke-Pnpm -Arguments @("dev:storage")
  Invoke-Pnpm -Arguments @("build")
  Invoke-Pnpm -Arguments @("--filter", "@xblog/web", "test:e2e")
} finally {
  foreach ($service in $restartQueue) {
    Start-Process -FilePath $pnpm `
      -ArgumentList @("--filter", $service.Filter, "dev") `
      -WorkingDirectory $workspaceRoot `
      -WindowStyle Hidden
  }
}
