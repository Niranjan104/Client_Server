terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Remote state stored in Azure Blob Storage.
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

data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

locals {
  container_app_environment_name = var.container_app_environment_name != "" ? var.container_app_environment_name : "cae-${var.nginx_dns_label}"
  log_analytics_workspace_name   = var.log_analytics_workspace_name != "" ? var.log_analytics_workspace_name : "law-${var.nginx_dns_label}"
}

# Shared image registry used by the pipeline.
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# Azure Container Apps needs a managed environment plus Log Analytics workspace.
resource "azurerm_log_analytics_workspace" "container_apps" {
  name                = local.log_analytics_workspace_name
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "app" {
  name                       = local.container_app_environment_name
  location                   = data.azurerm_resource_group.rg.location
  resource_group_name        = data.azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.container_apps.id
}

# Monitoring Stack (Prometheus & Grafana) remains on ACI for the existing DORA flow.
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

    volume {
      name       = "promconfig"
      mount_path = "/etc/prometheus"
      secret = {
        "prometheus.yml" = base64encode(templatefile("${path.module}/../monitoring/prometheus.azure.yml.tftpl", {}))
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
      GF_SERVER_HTTP_PORT        = "3001"
      GF_SECURITY_ADMIN_PASSWORD = "admin"
      PROMETHEUS_URL             = "http://localhost:9090"
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
        "azure_aci.json" = base64encode(templatefile("${path.module}/../monitoring/grafana/dashboards/azure_aci.json", {
          sub_id      = var.arm_subscription_id
          rg_name     = data.azurerm_resource_group.rg.name
          server_base = var.server_name
          client_base = var.client_name
          nginx_base  = var.nginx_dns_label
        }))
        "aca_runtime_analysis.json" = base64encode(templatefile("${path.module}/../monitoring/grafana/dashboards/aca_runtime_analysis.json", {
          sub_id      = var.arm_subscription_id
          rg_name     = data.azurerm_resource_group.rg.name
          server_base = var.server_name
          client_base = var.client_name
          nginx_base  = var.nginx_dns_label
        }))
        "dora_metrics.json" = base64encode(file("${path.module}/../monitoring/grafana/dashboards/dora_metrics.json"))
      }
    }
  }
}
