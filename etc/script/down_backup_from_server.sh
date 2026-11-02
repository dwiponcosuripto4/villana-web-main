#!/usr/bin/env bash

if [ -z "$DEPLOY_SERVER" ]; then
  echo "❌ Error: DEPLOY_SERVER environment variable is not set."
  exit 1
fi

rsync -avzrhcP -e "ssh -i etc/keys/villana.key" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.github \
  --exclude=static \
  --exclude=.svelte-kit \
  --exclude=tests \
  --exclude=e2e \
  --exclude=.env \
  --exclude=build/ \
  --delete-after \
  www@$DEPLOY_SERVER:/home/www/backups/villana/ ./backups/villana-prod-db
