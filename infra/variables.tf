variable "resource_group_name" {
  description = "Azure Resource Group name."
  type        = string
}

variable "acr_name" {
  description = "Azure Container Registry name. Use the short name, not the login server."
  type        = string
}

variable "acr_username" {
  description = "ACR admin username. Used by the monitoring ACI stack and bootstrap flow."
  type        = string
  sensitive   = true
}

variable "acr_password" {
  description = "ACR admin password. Used by the monitoring ACI stack and bootstrap flow."
  type        = string
  sensitive   = true
}

variable "server_name" {
  description = "Azure Container App name for the backend API."
  type        = string
  default     = "server-teastall"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,30}[a-z0-9]$", var.server_name)) && !can(regex("--", var.server_name))
    error_message = "server_name must be 2-32 lowercase letters, numbers, or hyphens; start with a letter; end with a letter/number; and not contain '--'."
  }
}

variable "client_name" {
  description = "Azure Container App name for the frontend."
  type        = string
  default     = "client-teastall"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,30}[a-z0-9]$", var.client_name)) && !can(regex("--", var.client_name))
    error_message = "client_name must be 2-32 lowercase letters, numbers, or hyphens; start with a letter; end with a letter/number; and not contain '--'."
  }
}

variable "nginx_dns_label" {
  description = "Azure Container App name for the public NGINX gateway."
  type        = string
  default     = "nginx-teastall"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,30}[a-z0-9]$", var.nginx_dns_label)) && !can(regex("--", var.nginx_dns_label))
    error_message = "nginx_dns_label must be 2-32 lowercase letters, numbers, or hyphens; start with a letter; end with a letter/number; and not contain '--'."
  }
}

variable "container_app_environment_name" {
  description = "Optional Azure Container Apps environment name. Defaults to cae-<nginx_dns_label>."
  type        = string
  default     = ""
}

variable "log_analytics_workspace_name" {
  description = "Optional Log Analytics workspace name for Container Apps logs. Defaults to law-<nginx_dns_label>."
  type        = string
  default     = ""
}

variable "tf_state_storage_account" {
  description = "Azure Storage Account name for Terraform remote state."
  type        = string
}
