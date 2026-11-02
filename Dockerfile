# Image produksi web app (memakai output: 'standalone' di next.config.ts)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* dibaca saat build, jadi harus dikirim sebagai build arg
# (Railway meneruskan variabel service sebagai build arg bila namanya dideklarasikan di sini.)
# Yang kosong memakai default di src/lib/config.ts dan src/lib/firebase.ts.
ARG NEXT_PUBLIC_API_BASE_URL=https://cardbusbackend-production.up.railway.app
ARG NEXT_PUBLIC_API_TIMEOUT_MS=
ARG NEXT_PUBLIC_PAYMENT_POLL_MS=
ARG NEXT_PUBLIC_CS_WHATSAPP=
ARG NEXT_PUBLIC_FIREBASE_API_KEY=
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=
ARG NEXT_PUBLIC_FIREBASE_APP_ID=
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_API_TIMEOUT_MS=$NEXT_PUBLIC_API_TIMEOUT_MS \
    NEXT_PUBLIC_PAYMENT_POLL_MS=$NEXT_PUBLIC_PAYMENT_POLL_MS \
    NEXT_PUBLIC_CS_WHATSAPP=$NEXT_PUBLIC_CS_WHATSAPP \
    NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
