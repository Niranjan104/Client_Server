# System Monitoring & Alerting Guide

This project includes a fully free, robust observability setup spanning container metrics and CI/CD deployment alerts.

## 1. CI/CD Deployment Alerts (Free Tool Setup)

We use powerful webhook integrations directly embedded in our GitHub Actions (`.github/workflows/cd.yml`) to send instant feedback to your team on every deployment or failure without needing third-party SaaS logging suites.

### What Metrics Are Tracked?
- **Build Status**: Are the Docker images building correctly?
- **Smoke Tests**: Is the backend (`/api/version`) and frontend reachable 45s post-deployment?
- **Deployment Duration**: How long the overall CI/CD process took.
- **Active Slot**: Which slot (blue/green) is currently handling live traffic.
- **Commit Details & Live URL**: Tracing exact revisions in production.
- **Failure Logs**: Direct links to GitHub actions logs when step failures occur.

### Setting Up Discord Alerts (Recommended Free Approach)
Discord webhooks are completely free, reliable, and parse JSON webhooks easily.

1. Create a private Discord server or channel for monitoring.
2. In your Discord channel settings: **Integrations** -> **Webhooks** -> **New Webhook**.
3. Name it `DeployBot` and copy the **Webhook URL**.
4. Navigate to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
5. Create a secret named `WEBHOOK_URL` and paste the URL.
6. Trigger a deployment. The pipeline will automatically send Success or Failure metrics directly to the chat!

*Note: The system also sends a `text` payload so this works natively with Slack Incoming Webhooks as well.*

## 2. Infrastructure Metrics (Prometheus + Grafana locally)

For analyzing the local docker containers and overall server health without paying for expensive tools like Datadog, we utilize **Prometheus** and **Grafana** via docker-compose profiles. 

### How to use:
Start your environment with the monitoring profile:

```bash
docker-compose --profile monitoring up -d
```

### Accessing the services
- **Prometheus** (Metrics Collector): `http://localhost:9090`
- **Grafana** (Visual Dashboards): `http://localhost:3001`
  - Default Login: Username: `admin`, Password: `admin` (or configured via variables).

### Viewing Dashboards
Grafana is now **pre-configured** with the Prometheus Data Source and an out-of-the-box Dashboard for your Docker system!

**How to see your metrics:**
1. Open **Grafana** (`http://localhost:3001`).
2. Log in using `admin` / `admin`.
3. In the left menu, go to **Dashboards**.
4. Click on **Docker System Metrics**.
5. You will instantly see live graphs for your CPU, RAM, Network Traffic, and Prometheus HTTP Requests!
