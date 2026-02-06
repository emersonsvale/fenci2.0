# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Passo Crítico: Copiar AMBOS os arquivos de dependência EXPLICITAMENTE
COPY package.json package-lock.json ./

# Instalação rigorosa (falha se o lockfile estiver errado)
RUN npm ci

# Copia o resto do código fonte
COPY . .

# Build do Nuxt
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copia apenas os arquivos necessários do build anterior
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0

# Define o usuário correto
USER nuxtjs

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
