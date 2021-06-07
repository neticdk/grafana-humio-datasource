FROM grafana/grafana:7.5.6

COPY dist /var/lib/grafana/plugins/netic-humio-datasource

# ... copy unzip /var/lib/grafana/plugins
