# Recording 인터페이스 계약 명세서

이 문서는 `Recording`서비스의 인터페이스를 정의합니다.

## 외부 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 엔드포인트 |
|---|---|---|---|---|
| EX-IFID-019 | CCTV | Recording | RTSP/RTP over TCP | `rtsp://[user:password@]{host}[:{port}]/{path}` |

## 내부 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 패턴 |
|---|---|---|---|---|
| IN-IFID-001 | Gateway | Recording | NestJS TCP | `{ cmd: "Get_healthz" }` |
| IN-IFID-002 | Gateway | Recording | NestJS TCP | `{ cmd: "Get_config_rtsp_urls" }` |
| IN-IFID-003 | Gateway | Recording | NestJS TCP | `{ cmd: "Get_config_rtsp_urls_:id" }` |
| IN-IFID-004 | Gateway | Recording | NestJS TCP | `{ cmd: "Post_config_rtsp_urls" }` |
| IN-IFID-005 | Gateway | Recording | NestJS TCP | `{ cmd: "Delete_config_rtsp_urls_:id" }` |
| IN-IFID-006 | Gateway | Recording | NestJS TCP | `{ cmd: "Get_config_segmentLength" }` |
| IN-IFID-007 | Gateway | Recording | NestJS TCP | `{ cmd: "Post_config_segmentLength" }` |
| IN-IFID-008 | Gateway | Recording | NestJS TCP | `{ cmd: "Get_config_Bucket" }` |
| IN-IFID-009 | Gateway | Recording | NestJS TCP | `{ cmd: "Post_config_Bucket" }` |
| IN-IFID-010 | Gateway | Recording | NestJS TCP | `{ cmd: "Get_config_rabbitmq_urls" }` |
| IN-IFID-011 | Gateway | Recording | NestJS TCP | `{ cmd: "Get_video-catalog_:streamID" }` |
| IN-IFID-012 | Recording | Encoder | AMQP | `queue: encoding_queue` · `pattern: encoding_request` |

## 인프라 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 엔드포인트 |
|---|---|---|---|---|
| INF-IFID-001 | Recording | RabbitMQ | AMQP | `amqp://{user}:{password}@{host}:5672/{vhost}` |
| INF-IFID-003 | Recording | DB | MySQL | `{DB_HOST}:{DB_PORT}/recording_service` · 테이블 `video_metadata` |
| INF-IFID-006 | Recording | S3 Object Storage | S3 API | `{S3_ENDPOINT}/{Bucket}/{Key}` · Bucket `stream{n}` · Key `{sessionId}-{timestamp}.ts` |
