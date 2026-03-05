output "nginx_public_url" {
  description = "The single public URL for the Tea Stall app (NGINX router)"
  value       = "http://${azurerm_container_group.nginx.fqdn}"
}

output "active_color" {
  description = "Currently active deployment slot"
  value       = var.active_color
}

output "blue_server_url" {
  description = "Blue slot server URL"
  value       = "http://${azurerm_container_group.server_blue.fqdn}:8080"
}

output "green_server_url" {
  description = "Green slot server URL"
  value       = "http://${azurerm_container_group.server_green.fqdn}:8080"
}
