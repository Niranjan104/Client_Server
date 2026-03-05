#!/bin/sh
# Substitute all env vars in the nginx config template at startup
envsubst '${ACTIVE_COLOR} ${BLUE_SERVER_HOST} ${GREEN_SERVER_HOST} ${BLUE_CLIENT_HOST} ${GREEN_CLIENT_HOST}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

echo "NGINX started | ACTIVE=${ACTIVE_COLOR} | blue_server=${BLUE_SERVER_HOST} | green_server=${GREEN_SERVER_HOST}"
exec nginx -g 'daemon off;'
