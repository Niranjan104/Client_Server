# ==============================================================================
# BLUE-GREEN DEPLOYMENT TRIGGER FOR NGINX (AZURE ACI)
# Description: This script connects to the live Azure Container Instance
#              running NGINX and flips the traffic between Blue and Green.
# ==============================================================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Niranjan Tea Stall - Blue/Green Deploy" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$resourceGroup = Read-Host "Enter your ACI Resource Group Name (e.g., devops-rg)"
$nginxContainerName = Read-Host "Enter your NGINX Container Name (e.g., client-instance)"
$target = Read-Host "Which environment do you want to route traffic to? (blue/green)"

if ($target -ne "blue" -and $target -ne "green") {
    Write-Host "Error: Target must be 'blue' or 'green'." -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/3] Setting target to $target environment..." -ForegroundColor Yellow
$configString = "set `$active_backend `"http://${target}_backend`";"

# Execute command inside the live ACI container to string replace the active environment
Write-Host "[2/3] Updating NGINX configuration inside Azure container..." -ForegroundColor Yellow
az container exec --resource-group $resourceGroup --name $nginxContainerName --exec-command "sh -c 'echo `"$configString`" > /etc/nginx/conf.d/active_env.conf'"

# Reload NGINX without dropping connections
Write-Host "[3/3] Initiating Zero-Downtime NGINX Reload..." -ForegroundColor Yellow
az container exec --resource-group $resourceGroup --name $nginxContainerName --exec-command "nginx -s reload"

Write-Host "`nSUCCESS: Traffic is now live on the $($target.ToUpper()) environment!" -ForegroundColor Green
Write-Host "Refresh your web browser to see the Live Version change seamlessly." -ForegroundColor Cyan
