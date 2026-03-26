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

variable "arm_client_id" { type = string }
variable "arm_client_secret" {
  type      = string
  sensitive = true
}
variable "arm_tenant_id" { type = string }
variable "arm_subscription_id" { type = string }

provider "azurerm" {
  features {}
}

# ── Backbone Infrastructure (Resource Group & ACR) ──────────────────────────
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
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
    server   = azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "server-blue"
    image  = var.blue_image_tag == "initial" ? "mcr.microsoft.com/azuredocs/aci-helloworld" : "${azurerm_container_registry.acr.login_server}/server:${var.blue_image_tag}"
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
    server   = azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "server-green"
    image  = var.green_image_tag == "initial" ? "mcr.microsoft.com/azuredocs/aci-helloworld" : "${azurerm_container_registry.acr.login_server}/server:${var.green_image_tag}"
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
    server   = azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "client-blue"
    image  = var.blue_image_tag == "initial" ? "mcr.microsoft.com/azuredocs/aci-helloworld" : "${azurerm_container_registry.acr.login_server}/client:${var.blue_image_tag}"
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
    server   = azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "client-green"
    image  = var.green_image_tag == "initial" ? "mcr.microsoft.com/azuredocs/aci-helloworld" : "${azurerm_container_registry.acr.login_server}/client:${var.green_image_tag}"
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
    server   = azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "nginx-router"
    # We use a public nginx image to bootstrap the gateway if the custom one is missing
    image  = var.blue_image_tag == "initial" ? "nginx:alpine" : "${azurerm_container_registry.acr.login_server}/nginx:latest"
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
      RESOLVER_IP        = "168.63.129.16"
    }
  }
}

# ── Monitoring Stack (Prometheus & Grafana) ──────────────────────────────────
resource "azurerm_container_group" "monitoring" {
  name                = "monitoring-teastall"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  os_type             = "Linux"
  ip_address_type     = "Public"
  dns_name_label      = "monitoring-teastall"

  image_registry_credential {
    server   = azurerm_container_registry.acr.login_server
    username = var.acr_username
    password = var.acr_password
  }

  container {
    name   = "prometheus"
    image  = "prom/prometheus:latest"
    cpu    = "0.5"
    memory = "1"

    ports {
      port     = 9090
      protocol = "TCP"
    }

    # Natively mount the custom scraping configuration via ACI secrets
    # This bypasses the need for custom external Docker images!
    volume {
      name       = "promconfig"
      mount_path = "/etc/prometheus"
      secret = {
        "prometheus.yml" = base64encode(file("${path.module}/../monitoring/prometheus.yml"))
      }
    }
  }

  container {
    name   = "pushgateway"
    image  = "prom/pushgateway:latest"
    cpu    = "0.25"
    memory = "0.5"

    ports {
      port     = 9091
      protocol = "TCP"
    }
  }

  container {
    name   = "grafana"
    image  = "grafana/grafana:latest"
    cpu    = "0.5"
    memory = "1"

    ports {
      port     = 3001
      protocol = "TCP"
    }

    environment_variables = {
      GF_SERVER_HTTP_PORT = "3001"
      GF_SECURITY_ADMIN_PASSWORD = "admin" # Explicitly default for review purposes
    }

    secure_environment_variables = {
      AZURE_TENANT_ID       = var.arm_tenant_id
      AZURE_CLIENT_ID       = var.arm_client_id
      AZURE_CLIENT_SECRET   = var.arm_client_secret
      AZURE_SUBSCRIPTION_ID = var.arm_subscription_id
    }

    volume {
      name       = "grafana-datasources"
      mount_path = "/etc/grafana/provisioning/datasources"
      secret = {
        "datasource.yml"    = base64encode(file("${path.module}/../monitoring/grafana/provisioning/datasources/datasource.yml"))
        "azure_monitor.yml" = base64encode(file("${path.module}/../monitoring/grafana/provisioning/datasources/azure_monitor.yml"))
      }
    }

    volume {
      name       = "grafana-dashboards-config"
      mount_path = "/etc/grafana/provisioning/dashboards"
      secret = {
        "dashboards.yml" = base64encode(file("${path.module}/../monitoring/grafana/provisioning/dashboards/dashboards.yml"))
      }
    }

    volume {
      name       = "grafana-dashboard-jsons"
      mount_path = "/var/lib/grafana/dashboards"
      secret = {
        "docker_containers.json" = base64encode(file("${path.module}/../monitoring/grafana/dashboards/docker_containers.json"))
        "azure_aci.json"         = base64encode(templatefile("${path.module}/../monitoring/grafana/dashboards/azure_aci.json", {
          rg_name     = data.azurerm_resource_group.rg.name
          server_base = var.server_name
          client_base = var.client_name
          nginx_base  = "nginx-teastall"
        }))
        "dora_metrics.json"      = base64encode(file("${path.module}/../monitoring/grafana/dashboards/dora_metrics.json"))
      }
    }
  }
}
