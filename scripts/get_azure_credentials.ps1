# This script generates the AZURE_CREDENTIALS JSON block needed by GitHub Actions.

Write-Host "This script will generate a JSON block for GitHub Actions to authenticate to Azure." -ForegroundColor Cyan
Write-Host "It DOES NOT create any new cloud services or incur any costs." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure you are logged into Azure CLI by running 'az login' before continuing." -ForegroundColor Yellow
Pause

# Get the active subscription ID
$subscriptionId = (az account show --query id -o tsv)

if (-not $subscriptionId) {
    Write-Host "Error: Could not retrieve Subscription ID. Please run 'az login' first." -ForegroundColor Red
    exit
}

$resourceGroupName = Read-Host "Enter the exact name of the Resource Group where your ACI is located"
$spName = "github-actions-acrcd-sp"

Write-Host "Generating Service Principal Credentials... Please wait." -ForegroundColor Cyan

# The --sdk-auth flag formats the output as a JSON expected by the 'azure/login' GitHub Action.
$jsonOutput = az ad sp create-for-rbac --name $spName --role contributor --scopes /subscriptions/$subscriptionId/resourceGroups/$resourceGroupName --json-auth 2>&1

# If the command outputted anything, print it
Write-Host "`n============= COPY THIS JSON BLOCK =============" -ForegroundColor Green
$jsonOutput
Write-Host "=================================================" -ForegroundColor Green

Write-Host "`nInstructions:" -ForegroundColor Cyan
Write-Host "Copy the block above, starting from { and ending with }."
Write-Host "Paste it as the value for the AZURE_CREDENTIALS secret in your GitHub repository."
