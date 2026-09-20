# Production Multi-Stage Dockerfile for Fund&Trace Backend (Express API)

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /opt/app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; \
    else npm install --production; fi

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /opt/app

ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001 -G nodejs

COPY --from=builder /opt/app/node_modules ./node_modules
# NOTE: .dockerignore keeps .env / logs / tests out of the build context, so
# this COPY cannot bake secrets into the image layers.
COPY . .

RUN chown -R app:nodejs /opt/app
USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]