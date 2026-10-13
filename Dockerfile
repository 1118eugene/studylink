FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000

# npm workspaces need every package manifest to resolve the root lockfile.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci --omit=dev --workspace=@studylink/api --workspace=@studylink/shared --include-workspace-root=false

COPY apps/api/backend ./apps/api/backend
COPY apps/api/scripts ./apps/api/scripts
COPY packages/shared ./packages/shared

RUN chown -R node:node /app

USER node

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "server", "--workspace=@studylink/api"]
