# ==========================================
# STAGE 1: Build Stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Define build-time arguments for Supabase (required for client bundlers like Vite)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Expose them as environment variables during build time
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Build the TanStack Start project (outputs to .output/)
RUN npm run build

# ==========================================
# STAGE 2: Production Runtime Stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy the built output from the build stage
COPY --from=builder /app/.output /app/.output

# Expose the server port
EXPOSE 3000

# Start the Nitro production server
CMD ["node", ".output/server/index.mjs"]
