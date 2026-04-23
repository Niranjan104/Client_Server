#!/bin/sh
set -eu

: "${PLATFORM:=local-compose}"
: "${RESOLVER_IP:=127.0.0.11}"
: "${BACKEND_UPSTREAM_URL:=http://server_blue:8080}"
: "${CLIENT_UPSTREAM_URL:=http://client_blue:3000}"

trim_trailing_slashes() {
  printf "%s" "$1" | sed 's#/*$##'
}

BACKEND_UPSTREAM_URL=$(trim_trailing_slashes "$BACKEND_UPSTREAM_URL")
CLIENT_UPSTREAM_URL=$(trim_trailing_slashes "$CLIENT_UPSTREAM_URL")

export PLATFORM
export RESOLVER_IP
export BACKEND_UPSTREAM_URL
export CLIENT_UPSTREAM_URL

envsubst '${PLATFORM} ${RESOLVER_IP} ${BACKEND_UPSTREAM_URL} ${CLIENT_UPSTREAM_URL}' \
  < /etc/nginx/nginx.conf.template \
  > /tmp/nginx/conf/nginx.conf

echo "NGINX started | platform=${PLATFORM} | backend=${BACKEND_UPSTREAM_URL} | client=${CLIENT_UPSTREAM_URL}"

exec nginx -c /tmp/nginx/conf/nginx.conf -g 'daemon off;'
