Start database:
cd database
docker compose up -d

Local Database Information：
host: localhost
port: 5432
db: judge
user: postgres
password: wrdd

If you need to reset database and re-import the data:
docker compose down -v
docker compose up -d
