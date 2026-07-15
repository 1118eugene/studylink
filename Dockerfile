FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
COPY backend ./backend
COPY scripts ./scripts
COPY src ./src
COPY index.html ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./

RUN npm install
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package.json ./
COPY backend ./backend
COPY scripts ./scripts
COPY --from=build /app/dist ./dist

RUN npm install --omit=dev

EXPOSE 4000
CMD ["node", "backend/server.js"]