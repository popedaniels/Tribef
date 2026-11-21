# Production Multi-Stage Dockerfile for Fund&Trace Backend (Express API)

# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder
WORKDIR /opt/app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 2: Production Runner
FROM node:22-alpine AS runner
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

# Liveness only: /live does not depend on MongoDB, so a database blip doesn't
# make the orchestrator kill healthy containers. Route traffic on /ready.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/live || exit 1

# server.js handles SIGTERM: drains in-flight requests, then exits.
STOPSIGNAL SIGTERM
CMD ["node", "server.js"]