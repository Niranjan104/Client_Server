# Monitoring Guide

This repository exposes local application metrics and deployment analytics through a split setup:

- Local Docker monitoring: Prometheus + Grafana + cAdvisor + NGINX exporter
- Cloud runtime monitoring: Azure Container Apps metrics and logs through Azure Monitor / Log Analytics
- Deployment analytics: Pushgateway-backed DORA-style dashboard in Grafana

## Local Monitoring

Start the full stack with monitoring enabled:

```bash
docker compose --profile monitoring up --build -d
```

Available services:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- Pushgateway: `http://localhost:9091`

Default Grafana login:

- Username: `admin`
- Password: `admin`

Pre-provisioned dashboards:

- `Docker System Metrics (Local Compose)`
- `Application Observability (Local Compose)`
- `Quantitative Performance Analysis (DORA)`

What is scraped locally:

- `prometheus` for collector health
- `pushgateway` for deployment analytics
- `cadvisor` for container CPU, memory, and network metrics
- `nginx_exporter` for reverse-proxy metrics
- `server_blue` and `server_green` for backend application metrics exposed at `/metrics`

## Backend Metrics

The Node API exposes Prometheus metrics at:

- `http://server_blue:8080/metrics`
- `http://server_green:8080/metrics`

Key application metrics include:

- `tea_http_requests_total`
- `tea_http_request_duration_seconds`
- `tea_http_errors_total`
- `tea_orders_created_total`
- `tea_order_value_rupees_total`
- `tea_payment_checks_total`
- `tea_payments_approved_total`
- `tea_unpaid_orders`

## DORA Metrics

The deployment workflow pushes one metric group per GitHub Actions run into Pushgateway using the `run_id` grouping key. This allows Grafana to query deployment history instead of only the latest sample.

If you want to see fresh DORA data after these changes, trigger a new deployment run so Grafana has at least one run-scoped metric set to read.

## Azure Monitoring

The application runtime now runs on Azure Container Apps. For production runtime health, use the Azure Portal Container App metrics and the Log Analytics workspace created by Terraform:

- `server-*-blue` and `server-*-green` Container Apps: backend slot replica count, requests, CPU, memory, and logs
- `client-*-blue` and `client-*-green` Container Apps: frontend slot replica count, requests, CPU, memory, and logs
- `nginx` Container App: stable gateway replica count, ingress requests, CPU, memory, and logs

The cloud Prometheus/Pushgateway/Grafana monitoring group remains on ACI for deployment analytics. The cloud Prometheus configuration intentionally scrapes only:

- `localhost:9090` for Prometheus
- `localhost:9091` for Pushgateway

This avoids false-down scrape targets in cloud environments where local Docker-only exporters such as `cadvisor` and `nginx_exporter` do not exist.
