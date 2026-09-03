# Cam-Vault

Cam-Vault는 RTSP 기반 CCTV 영상을 녹화하고, 인코딩하고, 비디오 메타데이터를 관리하기 위한 시스템입니다.
현재 저장소에는 백엔드 스택이 포함되어 있으며, 외부 요청은 `gateway` 서비스로 들어옵니다. 전체 시스템은 Docker Compose로 한 번에 실행할 수 있습니다.


## 기존 녹화 서버와의 차이점

- 서버 클러스터에 컨테이너로 배포함
- 녹화·인코딩 서비스를 마이크로서비스로 분리해 독립적으로 확장 가능
- S3 호환 객체 스토리지를 통해 저장 용량을 독립적으로 확장 가능
- 녹화되는 영상을 세그먼트 단위로 S3 호환 객체 스토리지로 바로 전송


## 핵심 기능

- 녹화 기능 
- 시간대별 동영상 조회 기능 
- 라이브 스트리밍 데모
- RESTfull API 제공 
- S3호환 객체 스토리지 지원
- CI/CD 및 서버 배포

  
## 프로젝트 구조
camvault는 멀티 백엔드 서비스로 게이트웨이를 통해 마이크로서비스로 접근하는 구조입니다.
하단은 camvault의 마이크로서비스 목록입니다.
- `gateway` (NestJS): 외부에 공개되는 HTTP API 게이트웨이
- `recording` (NestJS microservice): 녹화 스케줄 관리와 RTSP 녹화 작업 수행
- `encoder` (NestJS microservice): RabbitMQ 메시지를 받아 비디오 인코딩 수행
- `video-metadata-service` (Spring Boot): 비디오 메타데이터 CRUD 처리
- `mysql`: 비디오 메타데이터 저장
- `rabbitmq`: 비동기 메시지 브로커
- `storage`: S3객체 스토리지


## API 설명
라이브 스트리밍 데모를 제외한 기능은 REST API로 제공됩니다.
REST API<br>
<스웨거UI 링크>
라이브 스트리밍 데모<br>
<라이브 스트리밍 데모>


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


## 플로우 차트
<플로우 차트 링크>

기본 동작 흐름

기본 설정 기준으로 시스템은 아래 순서로 동작합니다.

1. 등록된 RTSP주소의 h264 스트림을 `recording` 서비스가 세그먼트 단위로 녹화합니다.
2. 녹화된 원본 파일은 S3객체 스토리지 서버에 직접 업로드됩니다. (`{RTSP 스트림 주소}`버킷에 `{세션ID}-{세그먼트생성시각}.ts` 형식으로 저장됩니다.)
3. 녹화가 끝나면 `recording` 서비스가 RabbitMQ로 인코딩 요청을 보냅니다.
4. `encoder` 서비스가 RabbitMQ에 대기된 인코딩 요청을 처리합니다.
5. 인코딩된 동영상은 스토리지 서버에 다시 업로드됩니다.

즉, 기본 흐름은 "녹화 -> 스토리지 서버에 저장 -> 인코딩 -> 원본 삭제"입니다. 


######################세부사항################

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

게이트웨이와 마이크로서비스들은 도커 내부 네트워크로 연결되며, 기본 설정에서는 호스트 포트를 직접 열지 않습니다.

## 스토리지 구조

기본 설정의 경우 S3 객체 스토리지로 SeaWeedFS를 사용하며. 프로젝트의 `./storage` 디렉터리는 컨테이너 내부에 마운트됩니다.

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

## 현재 상태 메모

- 일부 API는 아직 보완 중이므로 위 표에 현재 상태를 따로 정리해두었습니다.
