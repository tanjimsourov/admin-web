#############################
# Frontend Admin (CRA) Dockerfile
#############################

FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
ENV PORT=3002

# Replace default nginx site to listen on $PORT
RUN sed -i 's/listen       80;/listen       3002;/' /etc/nginx/conf.d/default.conf && \
    sed -i 's/listen       \[::\]:80;/listen       \[::\]:3002;/' /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002 || exit 1

CMD ["nginx", "-g", "daemon off;"]
