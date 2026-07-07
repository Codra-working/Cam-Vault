##node에 패키지 설치
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY /packages/yellowstone ./packages/yellowstone
COPY package*.json ./
RUN npm ci

## 환경변수와 시간존설정 apt-get 업데이트 ffmpeg 설치, 이미지 크기 최적화,소스 복사 
FROM node:22-bookworm-slim AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV TZ=Asia/Seoul
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "start:dev"]

## 설치된 노드 모듈을 복사하고 소스코드를 자바스크립트로 트랜스컴파일 한다
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY /packages/yellowstone ./packages/yellowstone
COPY package*.json ./
RUN npm ci --omit=dev

##트랜스컴파일된 소스와 노드모듈을 합쳐서 실행가능하게 만들고. /dist/main.js를 실행한다
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Seoul
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages ./packages
COPY --from=build /app/dist ./dist 
EXPOSE 3001
CMD ["node", "dist/main"]
