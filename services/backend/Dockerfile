FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY services/backend/package*.json ./services/backend/

RUN npm install

COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY services/backend ./services/backend

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/backend

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/services/backend ./services/backend
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

CMD ["npm", "run", "start", "--workspace=services/backend"]
