variable "resource_group_name" {
  description = "Azure Resource Group name"
  type        = string
}

variable "acr_name" {
  description = "Azure Container Registry name (short name, not login server)"
  type        = string
}

variable "acr_username" {
  description = "ACR admin username"
  type        = string
  sensitive   = true
}

variable "acr_password" {
  description = "ACR admin password"
  type        = string
  sensitive   = true
}

variable "server_name" {
  description = "Base name for server ACI containers (e.g. 'server-teastall')"
  type        = string
  default     = "server-teastall"
}

variable "client_name" {
  description = "Base name for client ACI containers (e.g. 'client-teastall')"
  type        = string
  default     = "client-teastall"
}

variable "active_color" {
  description = "Which slot is currently live: 'blue' or 'green'"
  type        = string
  default     = "blue"
  validation {
    condition     = contains(["blue", "green"], var.active_color)
    error_message = "active_color must be 'blue' or 'green'."
  }
}

variable "blue_image_tag" {
  description = "Docker image tag (Git SHA) deployed to the blue slot"
  type        = string
}

variable "green_image_tag" {
  description = "Docker image tag (Git SHA) deployed to the green slot"
  type        = string
}

variable "tf_state_storage_account" {
  description = "Azure Storage Account name for Terraform remote state"
  type        = string
}
