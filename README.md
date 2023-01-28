# template-common

## To run db

```bash
docker-compose up -d database
```

## To kill

### Find him

```bash
docker ps
```

In the table you can find your running containers and find uuid yours and kill him


```bash
docker kill 9750c4116f96
```

## After running database, create ```.env``` file and copy values from ```.env.example```

## And run migration
```bash
npm run migration
```
this creates structure in DB

## And start the server

```bash
npm run start
```

## To show swagger docs go to route ```/documentation```
