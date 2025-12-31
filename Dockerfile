# Stage 1: Build the Client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Server
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:18-alpine
WORKDIR /app

# Copy built server
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/package*.json ./server/
COPY --from=server-build /app/server/node_modules ./server/node_modules

# Copy built client to where the server expects it
# The server code looks for ../../client/dist relative to dist/index.js
# So if server runs from /app/server/dist/index.js, it looks for /app/client/dist
COPY --from=client-build /app/client/dist ./client/dist

# Install production dependencies only (optional cleanup)
# WORKDIR /app/server
# RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/server
CMD ["node", "dist/index.js"]
