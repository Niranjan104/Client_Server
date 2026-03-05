FROM nginx:alpine

# Install envsubst (part of gettext) for env variable substitution
RUN apk add --no-cache gettext

# Copy the config template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Startup script: substitute ${ACTIVE_COLOR} and launch nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
