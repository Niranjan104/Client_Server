# ---------- BUILD STAGE ----------
FROM mirror.gcr.io/library/node:20-alpine AS builder
WORKDIR /app

ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# ---------- RUNTIME STAGE ----------
FROM mirror.gcr.io/library/node:20-alpine

# create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Accept build arg again in runtime stage
ARG APP_VERSION
ENV APP_VERSION=$APP_VERSION

# copy files from builder
COPY --from=builder /app /app/

# change ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

CMD ["node", "server.js"]
