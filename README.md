# Grafana Data Source Plugin for Humio

## Getting started

1. Install dependencies

   ```bash
   yarn install
   ```

2. Build plugin in development mode or run in watch mode

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn watch
   ```

3. Build plugin in production mode

   ```bash
   yarn build
   ```

## Sign Plugin

```console
export GRAFANA_API_KEY=ey...
npx @grafana/toolkit plugin:sign --rootUrls https://observability.netic.dk,https://netic.dashboard.netic.dk,https://netic-internal.dashboard.netic.dk,https://netic-platform.dashboard.netic.dk,https://trifork.dashboard.netic.dk,https://dashboard.capturi.netic.dk,https://triforkops.dashboard.netic.dk
```

## Custom Container Image


