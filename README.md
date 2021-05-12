# Grafana Data Source Plugin Template

[![Build](https://github.com/grafana/grafana-starter-datasource/workflows/CI/badge.svg)](https://github.com/grafana/grafana-starter-datasource/actions?query=workflow%3A%22CI%22)

This template is a starting point for building Grafana Data Source Plugins

## What is Grafana Data Source Plugin?

Grafana supports a wide range of data sources, including Prometheus, MySQL, and even Datadog. There’s a good chance you can already visualize metrics from the systems you have set up. In some cases, though, you already have an in-house metrics solution that you’d like to add to your Grafana dashboards. Grafana Data Source Plugins enables integrating such solutions with Grafana.

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

## Learn more

- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System


## Humio

Streaming:
```
curl https://logging.netic.dk/api/v1/repositories/pd-main/query \
  -X POST \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJIdW1pby1sb2NhbCIsInN1YiI6InRhbEBuZXRpYy5kayIsInVpZCI6InBCeU43WW1tcmtNUG5Pa1BHTTlUMGtBciIsImlzcyI6Ikh1bWlvLWxvY2FsIiwiZXhwIjoxNjIwNzI2NTk3fQ.MLHheB32rGaaTsOrbBcZNuz5j9JIxPt356dp9NIpXl0" \
  -H 'Content-Type: application/json' \
  -H "Accept: application/x-ndjson" \
  -d '{"queryString":"","start":"1h","isLive":false}'
```

JSON:
```
curl https://logging.netic.dk/api/v1/repositories/pd-main/query \
  -X POST \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJIdW1pby1sb2NhbCIsInN1YiI6InRhbEBuZXRpYy5kayIsInVpZCI6InBCeU43WW1tcmtNUG5Pa1BHTTlUMGtBciIsImlzcyI6Ikh1bWlvLWxvY2FsIiwiZXhwIjoxNjIwNzI2NTk3fQ.MLHheB32rGaaTsOrbBcZNuz5j9JIxPt356dp9NIpXl0" \
  -H 'Content-Type: application/json' \
  -H "Accept: application/x-ndjson" \
  -d '{"queryString":"","start":"1h","isLive":false}'
```
