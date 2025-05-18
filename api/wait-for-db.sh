#!/bin/sh
# wait-for-db.sh

set -e

host="db"
user="$POSTGRES_USER"
password="$POSTGRES_PASSWORD"

until PGPASSWORD="$password" psql -h "$host" -U "$user" -d "$POSTGRES_DB" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec "$@" 