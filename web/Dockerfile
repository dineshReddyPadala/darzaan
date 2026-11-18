FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:3000
ARG VITE_API_MODE=http
ARG VITE_BUILD_MODE=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_MODE=$VITE_API_MODE
RUN if [ "$VITE_BUILD_MODE" = "staging" ]; then npm run build:staging; else npm run build; fi

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]