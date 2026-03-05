#!/bin/sh
# Substitute ${ACTIVE_COLOR} in the nginx config template at container startup
envsubst '${ACTIVE_COLOR}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
echo "NGINX started with ACTIVE_COLOR=${ACTIVE_COLOR}"
exec nginx -g 'daemon off;'
