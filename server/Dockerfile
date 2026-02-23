# BUILD---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# RUNTIME---
FROM node:20-alpine
# creating non root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

# copy necessary files from builder 
COPY --from=builder /app /app/

# change ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 5000
CMD ["node", "server.js"]
