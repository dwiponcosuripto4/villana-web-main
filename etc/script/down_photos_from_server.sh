#!/usr/bin/env bash

source .env

if [ -z "$DEPLOY_SERVER" ]; then
  echo "❌ Error: DEPLOY_SERVER environment variable is not set."
  exit 1
fi

function sync_files() {
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
    www@$DEPLOY_SERVER:/home/www/villana.id/$1/ ./$1
}
# rsync -avzrhcP -e "ssh -i etc/keys/villana.key" \
#   --exclude=node_modules \
#   --exclude=.git \
#   --exclude=.github \
#   --exclude=static \
#   --exclude=.svelte-kit \
#   --exclude=tests \
#   --exclude=e2e \
#   --exclude=.env \
#   --exclude=build/ \
#   --delete-after \
#   www@$DEPLOY_SERVER:/home/www/villana.id/static/ ./static

sync_files static/images-optm
sync_files static/uploads
