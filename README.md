# Grafana Humio Datasource

The Humio datasource allow using the Grafana explorer to query Humio logs using the Humio Query API.

## Configuration

The configuration uses the standard Grafana URL configuration as well as two extra fields specific to Humio:

- *Repository* The repository to be queried in Humio
- *API Key* Humio API token used when accessing the Humio Query API

![Configuration](https://github.com/neticdk/grafana-humio-datasource/raw/main/src/img/configuration.png)

(The API key is optional since this could also be handled by, e.g., an authentication proxy)

The plugin also supports deriving fields from the log entries, e.g., to enable linking to traces.
