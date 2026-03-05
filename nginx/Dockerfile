FROM nginx:alpine

# Install envsubst for env variable substitution at runtime
RUN apk add --no-cache gettext

# Copy template and entrypoint
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Pre-create all tmp dirs nginx needs, owned by nobody
RUN mkdir -p /tmp/nginx/client_body /tmp/nginx/proxy /tmp/nginx/fastcgi \
    /tmp/nginx/uwsgi /tmp/nginx/scgi /tmp/nginx/conf \
    && chown -R nobody:nobody /tmp/nginx

# Security: run as non-root
USER nobody

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
