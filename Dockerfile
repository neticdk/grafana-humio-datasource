FROM grafana/grafana:8.2.1

COPY dist /var/lib/netic/plugins/netic-humio-datasource

# ... copy unzip /var/lib/grafana/plugins
