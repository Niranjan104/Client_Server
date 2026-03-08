#!/bin/bash
# ==============================================================================
# Script: generate_credentials.sh
# Description: Automatically queries your active Azure account for its 
# Subscription ID and generates a new Service Principal with Contributor access.
# It outputs the exact JSON payload needed for the GitHub `AZURE_CREDENTIALS` secret.
# ==============================================================================

# Ensure Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "\033[0;31mError: Azure CLI ('az') is not installed or not in your PATH. Please install it first.\033[0m"
    exit 1
fi

echo -e "\033[0;36mFetching your active Azure Subscription ID...\033[0m"
SUB_ID=$(az account show --query id --output tsv)

if [ -z "$SUB_ID" ]; then
    echo -e "\033[0;31mError: Could not find an active Azure subscription. Are you logged in? Run 'az login' first.\033[0m"
    exit 1
fi

echo -e "\033[0;32mFound Subscription ID: $SUB_ID\033[0m"
echo -e "\033[0;36mGenerating a new Service Principal with Contributor access...\033[0m"

# The --sdk-auth flag formats the output perfectly for the GitHub azure/login action
JSON_OUTPUT=$(az ad sp create-for-rbac --name "GitHub-Pipeline-Bot" --role contributor --scopes /subscriptions/$SUB_ID --sdk-auth)

echo -e "\033[0;33m"
echo "========================================================================="
echo -e "\033[0;32m✅ SUCCESS! Copy the entire JSON block below and paste it into GitHub."
echo "   Repository Settings -> Secrets and variables -> Actions"
echo "   Create a new secret named: AZURE_CREDENTIALS"
echo -e "\033[0;33m=========================================================================\033[0m"
echo ""

echo "$JSON_OUTPUT"
