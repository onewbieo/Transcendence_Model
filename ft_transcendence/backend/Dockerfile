FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma client generation
RUN npx prisma generate

EXPOSE 3000

# Run migrations then start
CMD sh -c "npx prisma migrate deploy && npm run dev"
