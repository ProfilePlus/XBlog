FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
ENV CI=true
ARG NEXT_PUBLIC_XBLOG_API_URL
ENV NEXT_PUBLIC_XBLOG_API_URL=$NEXT_PUBLIC_XBLOG_API_URL

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @xblog/admin build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/admin/public ./apps/admin/public
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/package.json ./apps/admin/package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["pnpm", "--filter", "@xblog/admin", "start"]
