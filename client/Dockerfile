# BUILD---
FROM mirror.gcr.io/library/node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN  npm run build

# RUNTIME---
FROM mirror.gcr.io/library/node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app ./

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["npm","start"]
