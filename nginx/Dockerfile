FROM nginx:alpine

# Install envsubst for env variable substitution at runtime
RUN apk add --no-cache gettext

# Copy template and entrypoint
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Security: drop root — run nginx worker processes as 'nobody'
USER nobody

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
