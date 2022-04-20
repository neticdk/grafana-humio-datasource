FROM grafana/grafana:8.4.6

COPY dist /var/lib/netic/plugins/netic-humio-datasource

# ... copy unzip /var/lib/grafana/plugins
