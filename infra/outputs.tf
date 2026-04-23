output "container_app_environment_name" {
  description = "Azure Container Apps environment name."
  value       = azurerm_container_app_environment.app.name
}

output "container_app_environment_id" {
  description = "Azure Container Apps environment resource ID."
  value       = azurerm_container_app_environment.app.id
}

output "container_app_environment_default_domain" {
  description = "Default DNS suffix for apps in this Container Apps environment."
  value       = azurerm_container_app_environment.app.default_domain
}

output "nginx_public_url" {
  description = "Expected public URL for the NGINX Container App after the delivery job creates it."
  value       = "https://${var.nginx_dns_label}.${azurerm_container_app_environment.app.default_domain}"
}

output "server_container_app_url" {
  description = "Expected public URL for the backend Container App after the delivery job creates it."
  value       = "https://${var.server_name}.${azurerm_container_app_environment.app.default_domain}"
}

output "client_container_app_url" {
  description = "Expected public URL for the frontend Container App after the delivery job creates it."
  value       = "https://${var.client_name}.${azurerm_container_app_environment.app.default_domain}"
}

output "monitoring_public_url" {
  description = "Public URL for the existing Prometheus/Grafana/Pushgateway ACI monitoring group."
  value       = "http://${azurerm_container_group.monitoring.fqdn}"
}
