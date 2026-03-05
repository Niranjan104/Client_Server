terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Remote state stored in Azure Blob Storage 
  # (pre-create this storage account once manually or via bootstrap script)
  backend "azurerm" {
    resource_group_name  = "Niranjan_rg"
    storage_account_name = var.tf_state_storage_account
    container_name       = "tfstate"
    key                  = "teastall.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# ── Data: existing resource group and ACR ───────────────────────────────────
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = var.resource_group_name
}

# ── Blue Server ACI ──────────────────────────────────────────────────────────
resource "azurerm_container_group" "server_blue" {
  name                = "${var.server_name}-blue"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = "${var.server_name}-blue"

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "server-blue"
    image  = "${data.azurerm_container_registry.acr.login_server}/server:${var.blue_image_tag}"
    cpu    = "0.5"
    memory = "1"

    ports {
      port     = 8080
      protocol = "TCP"
    }

    environment_variables = {
      PORT        = "8080"
      APP_VERSION = "blue"
    }
  }
}

# ── Green Server ACI ─────────────────────────────────────────────────────────
resource "azurerm_container_group" "server_green" {
  name                = "${var.server_name}-green"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = "${var.server_name}-green"

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "server-green"
    image  = "${data.azurerm_container_registry.acr.login_server}/server:${var.green_image_tag}"
    cpu    = "0.5"
    memory = "1"

    ports {
      port     = 8080
      protocol = "TCP"
    }

    environment_variables = {
      PORT        = "8080"
      APP_VERSION = "green"
    }
  }
}

# ── Blue Client ACI ──────────────────────────────────────────────────────────
resource "azurerm_container_group" "client_blue" {
  name                = "${var.client_name}-blue"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = "${var.client_name}-blue"

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "client-blue"
    image  = "${data.azurerm_container_registry.acr.login_server}/client-blue:${var.blue_image_tag}"
    cpu    = "0.5"
    memory = "1"

    ports {
      port     = 3000
      protocol = "TCP"
    }
  }
}

# ── Green Client ACI ─────────────────────────────────────────────────────────
resource "azurerm_container_group" "client_green" {
  name                = "${var.client_name}-green"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = "${var.client_name}-green"

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "client-green"
    image  = "${data.azurerm_container_registry.acr.login_server}/client-green:${var.green_image_tag}"
    cpu    = "0.5"
    memory = "1"

    ports {
      port     = 3000
      protocol = "TCP"
    }
  }
}

# ── NGINX Router ACI (single public entry point) ─────────────────────────────
resource "azurerm_container_group" "nginx" {
  name                = "nginx-teastall"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = "nginx-teastall"

  image_registry_credential {
    server   = data.azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "nginx-router"
    image  = "${data.azurerm_container_registry.acr.login_server}/nginx:latest"
    cpu    = "0.25"
    memory = "0.5"

    ports {
      port     = 80
      protocol = "TCP"
    }

    environment_variables = {
      # This is the key: change ACTIVE_COLOR via terraform apply to switch slots
      ACTIVE_COLOR       = var.active_color
      BLUE_SERVER_HOST   = "${var.server_name}-blue.centralindia.azurecontainer.io"
      GREEN_SERVER_HOST  = "${var.server_name}-green.centralindia.azurecontainer.io"
      BLUE_CLIENT_HOST   = "${var.client_name}-blue.centralindia.azurecontainer.io"
      GREEN_CLIENT_HOST  = "${var.client_name}-green.centralindia.azurecontainer.io"
    }
  }
}
