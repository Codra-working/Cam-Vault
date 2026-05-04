# Cam-Vault

Cam-Vault는 CCTV 영상을 녹화하고 관리할 수 있는 웹 애플리케이션입니다.

이 저장소에는 그 웹 애플리케이션의 백엔드 코드가 들어 있습니다. 사용자의 요청은 먼저 `gateway`가 받고, 필요한 서비스로 전달합니다. 전체 서비스는 Docker Compose로 한 번에 실행할 수 있습니다.

## 프로젝트 개요

현재 스택은 아래 서비스로 구성되어 있습니다.

- `gateway` (NestJS): 외부에 공개되는 HTTP API
- `recording` (NestJS microservice): 녹화 스케줄 관리와 RTSP 녹화 작업 수행
- `encoder` (NestJS microservice): RabbitMQ 메시지를 받아 비디오 인코딩 수행
- `video-metadata-service` (Spring Boot): 비디오 메타데이터 CRUD 처리
- `mysql`: 비디오 메타데이터 저장
- `rabbitmq`: 서비스 간 비동기 작업 전달

## 현재 기본 동작

기본 설정 기준으로 시스템은 아래 순서로 동작합니다.

1. `recording` 서비스가 매 분마다 RTSP 스트림을 10초씩 녹화합니다.
2. 녹화된 원본 파일은 `./storage/recordings`에 `.ts` 파일로 저장됩니다.
3. 녹화가 끝나면 `recording` 서비스가 RabbitMQ로 인코딩 요청을 보냅니다.
4. `encoder` 서비스가 원본 파일을 인코딩해 `./storage/recordings/encoded`에 결과 파일을 생성합니다.
5. 인코딩이 완료되면 원본 녹화 파일은 삭제됩니다.

즉, 기본 흐름은 "녹화 -> 원본 저장 -> 인코딩 -> 원본 삭제"입니다.

## 주요 기능

- 하나 이상의 RTSP 스트림 녹화
- 스케줄 기반 자동 녹화
- RabbitMQ 기반 비동기 인코딩
- 비디오 메타데이터 조회 및 관리
- Docker Compose 기반 통합 실행

## 아키텍처

```text
Client
  |
  v
Gateway (NestJS, :3000)
  |-- /videos ------------------------> Video Metadata Service (Spring Boot, internal :8080) -> MySQL
  |
  '-- /recording/config -------------> Recording Service (NestJS TCP, internal :3001)
                                          |
                                          '-- Encoding jobs -> RabbitMQ -> Encoder (NestJS) -> storage
```

## 빠른 시작

### 1. 환경 변수 파일 준비

`.env.example`을 기준으로 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

기본값만으로도 로컬 실행이 가능합니다.

### 2. 전체 스택 실행

```bash
docker compose up --build -d
```

### 3. 상태 확인

```bash
docker compose ps
```

### 4. 종료

```bash
docker compose down
```

데이터베이스 볼륨까지 함께 지우려면:

```bash
docker compose down -v
```

## 기본 접속 주소

- Gateway API: `http://localhost:3000`
- RabbitMQ 관리 화면: `http://localhost:15672`
- RabbitMQ 기본 계정: `guest / guest`

`mysql`, `recording`, `encoder`, `video-metadata-service`는 Docker Compose 내부 네트워크로 연결되며, 기본 설정에서는 호스트 포트를 직접 열지 않습니다.

## 스토리지 구조

프로젝트의 `./storage` 디렉터리는 컨테이너 내부에 마운트됩니다.

- 원본 녹화 파일: `./storage/recordings`
- 인코딩 결과 파일: `./storage/recordings/encoded`

## 환경 변수

[.env.example](/c:/Users/dongdong/Documents/GitHub/Cam-Vault/.env.example)에 포함된 주요 변수는 아래와 같습니다.

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `GATEWAY_PORT` | `3000` | Gateway HTTP 포트 |
| `MYSQL_ROOT_PASSWORD` | `root` | MySQL root 비밀번호 |
| `DB_NAME` | `test` | MySQL 데이터베이스 이름 |
| `DB_USERNAME` | `root` | 데이터베이스 사용자 이름 |
| `DB_PASSWORD` | `root` | 데이터베이스 비밀번호 |
| `DB_SYNCHRONIZE` | `false` | Nest 서비스의 TypeORM 동기화 여부 |
| `RABBITMQ_DEFAULT_USER` | `guest` | RabbitMQ 로그인 사용자 |
| `RABBITMQ_DEFAULT_PASS` | `guest` | RabbitMQ 로그인 비밀번호 |
| `RECORDING_STREAMS` | 예시 RTSP URL 1개 | 녹화 대상 RTSP 주소 목록 |
| `RECORDING_CRON` | `* * * * *` | 녹화 실행 주기 |
| `VIDEO_LENGTH` | `10` | 한 번에 녹화할 영상 길이(초) |

기본 설정에서는 `RECORDING_CRON=* * * * *`, `VIDEO_LENGTH=10`이므로 매 분마다 10초 길이의 영상을 녹화합니다.

## API 요약

현재 gateway를 통해 아래 API를 사용할 수 있습니다.

### 현재 동작하는 API

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/videos` | 비디오 메타데이터 목록 조회 |
| `GET` | `/videos/:uuid` | 비디오 메타데이터 단건 조회 |
| `GET` | `/recording/config` | 현재 녹화 설정 조회 |

### 구현은 되어 있지만 보완이 필요한 API

| Method | Path | 현재 상태 |
| --- | --- | --- |
| `POST` | `/videos` | gateway 컨트롤러의 request body 바인딩이 아직 미완성 |
| `GET` | `/videos/:uuid/encoding-status` | encoded 상태 영속화가 아직 완전히 연결되지 않음 |
| `DELETE` | `/videos/:uuid` | 라우트는 존재하며 metadata service로 전달됨 |
| `PUT` | `/recording/config` | end-to-end 갱신 흐름이 아직 완전히 연결되지 않음 |
| `GET` | `/recording` | 현재는 빈 응답을 반환하는 placeholder 상태 |

## 사용 예시

### 전체 비디오 목록 조회

```bash
curl http://localhost:3000/videos
```

### 비디오 단건 조회

```bash
curl http://localhost:3000/videos/<video-uuid>
```

### 현재 녹화 설정 조회

```bash
curl http://localhost:3000/recording/config
```

응답 예시:

```json
{
  "streams": [
    "rtsp://210.99.70.120:1935/live/cctv001.stream"
  ],
  "targetDir": "/app/storage/recordings",
  "duration": "* * * * *",
  "videoLen": 10
}
```

## 프로젝트 구조

```text
.
|-- gateway/
|-- recording/
|-- encoder/
|-- video-metadata-service/
|-- docker/
|   '-- mysql/init/
|-- storage/
|-- docker-compose.yml
`-- .env.example
```

## 자주 쓰는 명령어

전체 로그 보기:

```bash
docker compose logs -f
```

특정 서비스만 다시 빌드해서 실행:

```bash
docker compose up --build -d gateway
```

실행 중인 컨테이너 확인:

```bash
docker compose ps
```

## 현재 상태 메모

- 일부 API는 아직 보완 중이므로 위 표에 현재 상태를 따로 정리해두었습니다.
- 녹화와 인코딩은 정상 동작합니다.
