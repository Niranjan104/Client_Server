# Azure VM Provisioning Script for PowerShell
# This script creates an Ubuntu VM on Azure suitable for Docker-based deployments.

$RESOURCE_GROUP = "rg-student-project"
$LOCATION = "centralus"
$VM_NAME = "vm-app-server"
$ADMIN_USER = "azureuser"

Write-Host "Creating Resource Group: $RESOURCE_GROUP in $LOCATION..." -ForegroundColor Cyan
az group create --name $RESOURCE_GROUP --location $LOCATION | Out-Null

Write-Host "Creating Virtual Machine: $VM_NAME (Ubuntu 22.04 LTS)..." -ForegroundColor Cyan
az vm create `
    --resource-group $RESOURCE_GROUP `
    --name $VM_NAME `
    --image Ubuntu2204 `
    --admin-username $ADMIN_USER `
    --generate-ssh-keys `
    --size Standard_B1s `
    --public-ip-sku Standard | Out-Null

Write-Host "Opening port 80 (HTTP) for NGINX..." -ForegroundColor Cyan
az vm open-port --port 80 --resource-group $RESOURCE_GROUP --name $VM_NAME | Out-Null

Write-Host "Opening port 443 (HTTPS)..." -ForegroundColor Cyan
az vm open-port --port 443 --resource-group $RESOURCE_GROUP --name $VM_NAME | Out-Null

Write-Host "Retrieving Public IP Address..." -ForegroundColor Cyan
$PUBLIC_IP = (az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME --show-details --query publicIps -o tsv)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "VM provisioning complete!" -ForegroundColor Green
Write-Host "Public IP: $PUBLIC_IP" -ForegroundColor Yellow
Write-Host "Username: $ADMIN_USER" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS for GitHub Secrets:" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub repository -> Settings -> Secrets and variables -> Actions"
Write-Host "2. Add a new repository secret named AZURE_VM_IP with the value: $PUBLIC_IP"
Write-Host "3. Add a new repository secret named AZURE_VM_USERNAME with the value: $ADMIN_USER"
Write-Host "4. Add a new repository secret named AZURE_VM_SSH_KEY."
Write-Host "   To get the key, run this command on your local machine:"
Write-Host "   Get-Content ~/.ssh/id_rsa"
Write-Host "   (or wherever your private SSH key is stored, often `~/.ssh/id_rsa.pub`'s counterpart)"
Write-Host ""
Write-Host "NEXT STEPS for the VM:" -ForegroundColor Cyan
Write-Host "SSH into your new VM: ssh ${ADMIN_USER}@${PUBLIC_IP}"
Write-Host "Then, run these commands to install Docker & Git:"
Write-Host "  sudo apt update"
Write-Host "  sudo apt install -y docker.io docker-compose git"
Write-Host "  sudo systemctl enable docker"
Write-Host "  sudo usermod -aG docker $ADMIN_USER"
Write-Host "Exit the SSH session and log back in for docker permissions to apply."
