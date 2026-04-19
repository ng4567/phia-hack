# Introduction

Style-Me is a simple web-app made to make it easy for stylists to manage a portfolio of clients. The app provides stylists the functionality to input pictures of clothes and their clients, and then send them visualizations of the clothes on their body.

Using the FASHN Virtual Try-On API, we can return images of the clothes styled on someone's body given their picture and pictures of the clothes.

# Architecture

- Frontend: React
- Backend: Python/FastAPI
- Virtual Try-On: [FASHN Virtual Try-On v1.6](https://docs.fashn.ai/)
- LLM Provider: Microsoft Foundry

# Build and Deployment

Build container image:

```bash
docker compose build allinone
```

Run container image:

```bash
docker compose up -d allinone
```

Local deployment (all-in-one):

- App (frontend + proxied backend):
  - http://localhost:8080
- Health endpoint:
  - http://localhost:8080/health
- Backend API examples:
  - http://localhost:8080/api/stylist-agent/message
  - http://localhost:8080/api/tryon

Optional split mode (legacy local ports):

```bash
docker compose --profile split up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Azure Container Apps deployment (required for Telegram)

Set required shell variables:

```bash
export RG="finance-app-ng"
export LOC="eastus2"
export ACR="regngasdf"
export ENV="phia-ca-env"
export APP="phia-allinone"
export IMAGE="phia-allinone:latest"
```

Sanity-check required variables (prevents empty image tag errors):

```bash
: "${RG:?RG is not set}" "${LOC:?LOC is not set}" "${ACR:?ACR is not set}" "${ENV:?ENV is not set}" "${APP:?APP is not set}" "${IMAGE:?IMAGE is not set}"
```

Authenticate to Azure / select subscription:

```bash
az login
az account set --subscription "<your-subscription-id-or-name>"
```

Ensure resource group + ACR + ACA environment exist:

```bash
az group create -n "$RG" -l "$LOC"
az acr create -n "$ACR" -g "$RG" --sku Basic
az containerapp env create -n "$ENV" -g "$RG" -l "$LOC"
```

Build/push image to ACR:

```bash
az acr build -r "$ACR" -t "$IMAGE" -f Dockerfile.allinone .
```

Get ACR connection values:

```bash
export ACR_SERVER=$(az acr show -n "$ACR" --query loginServer -o tsv)
export ACR_USER=$(az acr credential show -n "$ACR" --query username -o tsv)
export ACR_PASS=$(az acr credential show -n "$ACR" --query "passwords[0].value" -o tsv)
```

Create ACA app (single all-in-one container, ingress on port 8080):

```bash
az containerapp create \
  -n "$APP" \
  -g "$RG" \
  --environment "$ENV" \
  --image "$ACR_SERVER/$IMAGE" \
  --ingress external \
  --target-port 8080 \
  --registry-server "$ACR_SERVER" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --secrets \
    FASHN_API_KEY="<value>" \
    FAL_KEY="<value>" \
    AZURE_CLIENT_SECRET="<value>" \
    TELEGRAM_BOT_TOKEN="<value>" \
    TELEGRAM_WEBHOOK_SECRET="<value>" \
  --env-vars \
    ENV=production \
    AZURE_PROJECT_ENDPOINT="https://finance-app-resource.services.ai.azure.com/" \
    AZURE_TENANT_ID="<value>" \
    AZURE_CLIENT_ID="<value>" \
    AZURE_MODEL="gpt-5.4" \
    FASHN_API_KEY=secretref:FASHN_API_KEY \
    FAL_KEY=secretref:FAL_KEY \
    AZURE_CLIENT_SECRET=secretref:AZURE_CLIENT_SECRET \
    TELEGRAM_BOT_TOKEN=secretref:TELEGRAM_BOT_TOKEN \
    TELEGRAM_WEBHOOK_SECRET=secretref:TELEGRAM_WEBHOOK_SECRET
```

If app already exists:

```bash
az containerapp update \
  -n "$APP" \
  -g "$RG" \
  --image "$ACR_SERVER/$IMAGE" \
  --set-env-vars \
    ENV=production \
    AZURE_PROJECT_ENDPOINT="https://finance-app-resource.services.ai.azure.com/" \
    AZURE_TENANT_ID="<value>" \
    AZURE_CLIENT_ID="<value>" \
    AZURE_MODEL="gpt-5.4"
```

Get app URL and verify deployment:

```bash
export FQDN=$(az containerapp show -n "$APP" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv)
echo "https://$FQDN"
curl -i "https://$FQDN/health"
```

Configure Telegram webhook to backend route:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://$FQDN/webhooks/telegram\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\"}"
```

Verify Telegram webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```