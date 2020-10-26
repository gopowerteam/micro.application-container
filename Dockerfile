# 编译阶段
FROM node:12.19.0-slim as builder

ADD . /builder/
WORKDIR /builder

RUN yarn config set registry https://registry.npm.taobao.org/ \
  && yarn \
  && npm run build \
  && rm -rf src test

# 运行阶段
FROM node:12.19.0-alpine

COPY --from=builder /builder/ /app/

EXPOSE 8090

ENTRYPOINT [ "node", "/app/dist/main" ]




