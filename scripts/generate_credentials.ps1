<#
.SYNOPSIS
Generates an Azure Service Principal JSON block for GitHub Actions.

.DESCRIPTION
This script automatically queries your currently logged-in Azure account for its 
Subscription ID and generates a new Service Principal with the Contributor role. 
It outputs the exact JSON payload you need to copy and paste into your GitHub 
Repository Secret named `AZURE_CREDENTIALS`.

.EXAMPLE
.\generate_credentials.ps1
#>

# Ensure Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI ('az') is not installed or not in your PATH. Please install it first."
    exit 1
}

Write-Host "Fetching your active Azure Subscription ID..." -ForegroundColor Cyan
$SubId = az account show --query id --output tsv

if (-not $SubId) {
    Write-Error "Could not find an active Azure subscription. Are you logged in? Run 'az login' first."
    exit 1
}

Write-Host "Found Subscription ID: $SubId" -ForegroundColor Green
Write-Host "Generating a new Service Principal with Contributor access..." -ForegroundColor Cyan

# The --sdk-auth flag formats the output perfectly for the GitHub azure/login action
$JsonOutput = az ad sp create-for-rbac --name "GitHub-Pipeline-Bot" --role contributor --scopes /subscriptions/$SubId --sdk-auth

Write-Host "`n=========================================================================" -ForegroundColor Yellow
Write-Host "✅ SUCCESS! Copy the entire JSON block below and paste it into GitHub." -ForegroundColor Green
Write-Host "   Repository Settings -> Secrets and variables -> Actions" -ForegroundColor Green
Write-Host "   Create a new secret named: AZURE_CREDENTIALS" -ForegroundColor Green
Write-Host "=========================================================================`n" -ForegroundColor Yellow

$JsonOutput
