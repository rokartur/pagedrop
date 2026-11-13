FROM oven/bun:1.4.4-alpine
WORKDIR /app
COPY server.ts favicon.ico ./
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
# a fresh named volume copies this owner, so pages survive deploys and stay writable
RUN mkdir -p /data && chown bun:bun /data
USER bun
EXPOSE 3000
CMD ["bun", "server.ts"]
