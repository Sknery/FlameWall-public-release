docker-compose exec backend npm run typeorm -- migration:generate src/migrations/FileName
docker-compose exec backend npm run migration:run
