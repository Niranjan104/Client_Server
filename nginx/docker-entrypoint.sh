#!/bin/sh
set -e

# Write the processed config to /tmp where nobody has write access
envsubst '${ACTIVE_COLOR} ${BLUE_SERVER_HOST} ${GREEN_SERVER_HOST} ${BLUE_CLIENT_HOST} ${GREEN_CLIENT_HOST} ${RESOLVER_IP}' \
  < /etc/nginx/nginx.conf.template \
  > /tmp/nginx/conf/nginx.conf

echo "NGINX started | ACTIVE=${ACTIVE_COLOR} | blue_server=${BLUE_SERVER_HOST} | green_server=${GREEN_SERVER_HOST}"

# Start nginx pointing at the writable config location
exec nginx -c /tmp/nginx/conf/nginx.conf -g 'daemon off;'
