FROM why-term:base AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src/ src/
RUN npm run build && npm prune --production

FROM why-term:base
WORKDIR /app
COPY static/ static/
COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/build/ ./
ENTRYPOINT [ "node", "why-term.js" ]
