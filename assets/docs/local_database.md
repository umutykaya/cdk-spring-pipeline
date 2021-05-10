# Local Database 

PSQL Database with Docker Container
You can create a PostgreSQL database for the local development using Docker container as follows;
```bash
docker create --name postgres-demo -e POSTGRES_PASSWORD=Welcome -p 5432:5432 postgres:11.5-alpine
```
```bash
docker start postgres-demo
```

```bash
docker stop postgres-demo
```

Access Details:

```bash
JDBC URL: `jdbc:postgresql://localhost:5432/conference_app`

Username: `postgres`

Password: `Welcome`
```

It is important to bear in mind that when you delete the container, you would delete all the data because of the data inner the container.
 

At this point, you need to connect from your local development to a PostgreSQL database in docker. 

```bash
docker exec -it postgres-demo psql -U postgres

```

This document has been referenced from the [course](https://github.com/dlbunker/ps-first-spring-boot-app/tree/master/database/postgresql) of dlbunker