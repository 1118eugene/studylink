FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --omit=dev

COPY backend ./backend
COPY scripts ./scripts

EXPOSE 4000
CMD ["npm", "run", "server"]
