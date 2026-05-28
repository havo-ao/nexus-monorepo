# Elastic observability

Acciones ElBosque includes a local Elastic stack for operational log visibility:

- Elasticsearch stores Docker container logs.
- Kibana provides the web UI to search and inspect logs.
- Filebeat reads container logs and ships only Acciones ElBosque containers.

The stack is optional and runs under the Docker Compose `observability` profile, so the normal development startup remains lightweight.

## Start the stack

From the repository root:

```bash
docker compose -f infrastructure/docker/docker-compose.yml --profile observability up -d --build
```

Kibana will be available at:

```txt
http://localhost:5601
```

Elasticsearch will be available at:

```txt
http://localhost:9200
```

## Kibana data view

You can configure Kibana automatically:

```bash
node infrastructure/observability/elastic/configure-kibana.mjs
```

Or configure it manually:

In Kibana:

1. Go to **Stack Management**.
2. Open **Data Views**.
3. Create a data view with this pattern:

```txt
acciones-elbosque-logs-*
```

4. Use `@timestamp` as the timestamp field.
5. Open **Discover** and filter by fields such as:

```txt
container.name
message
project.name
project.architecture
```

Useful filters:

```txt
container.name: "nexus-trading-service"
container.name: "nexus-identity-service"
container.name: "nexus-portfolio-service"
container.name: "nexus-market-service"
container.name: "compliance-service"
```

## Stop only observability

```bash
docker compose -f infrastructure/docker/docker-compose.yml --profile observability stop elasticsearch kibana filebeat
```

## Architecture note

This supports the observability quality attribute in the SBA deployment by centralizing logs from independently deployed services without changing their business logic.
