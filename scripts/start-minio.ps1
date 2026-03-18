$ErrorActionPreference = "Stop"

$containerName = "xblog-minio"
$image = "minio/minio:latest"
$rootUser = "xblogminio"
$rootPassword = "xblogminio123"
$healthUrl = "http://127.0.0.1:9000/minio/health/live"
$workspaceRoot = Split-Path -Parent $PSScriptRoot

$existing = docker ps -a --filter "name=^/$containerName$" --format "{{.Names}}"

if (-not $existing) {
  docker run -d `
    --name $containerName `
    -p 9000:9000 `
    -p 9001:9001 `
    -e "MINIO_ROOT_USER=$rootUser" `
    -e "MINIO_ROOT_PASSWORD=$rootPassword" `
    -v "xblog-minio-data:/data" `
    $image server /data --console-address ":9001" | Out-Null
} else {
  $running = docker ps --filter "name=^/$containerName$" --format "{{.Names}}"
  if (-not $running) {
    docker start $containerName | Out-Null
  }
}

$deadline = (Get-Date).AddSeconds(60)
$ready = $false

while ((Get-Date) -lt $deadline) {
  try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}

if (-not $ready) {
  throw "MinIO did not become ready at $healthUrl within 60 seconds."
}

pnpm --dir $workspaceRoot --filter @xblog/api object-storage:bootstrap
