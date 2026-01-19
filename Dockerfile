# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .

# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install --production=false
RUN npm run build

# --- Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./
# Install ALL dependencies (including dev) for runtime TypeScript support
RUN npm install --production=false
EXPOSE 3000

# --- Install Caddy for SSL and static serving ---
RUN apk add --no-cache caddy

# --- Copy Caddyfile ---
COPY Caddyfile /etc/caddy/Caddyfile

# --- Start Next.js and Caddy ---
CMD ["sh", "-c", "npx next start & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
