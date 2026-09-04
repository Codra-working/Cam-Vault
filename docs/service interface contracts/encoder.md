# Encoder 인터페이스 계약 명세서

이 문서는 `Encoder`서비스의 인터페이스를 정의합니다.

## 외부 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 엔드포인트 |
|---|---|---|---|---|
| - | - | - | - | 해당 없음 |

## 내부 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 패턴 |
|---|---|---|---|---|
| - | - | - | - | 해당 없음 |

## 인프라 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 엔드포인트 |
|---|---|---|---|---|
| INF-IFID-002 | RabbitMQ | Encoder | AMQP | `amqp://{user}:{password}@{host}:5672/{vhost}` · `queue: encoding_queue` · `pattern: encoding_request` |
| INF-IFID-004 | Encoder | DB | MySQL | `{DB_HOST}:{DB_PORT}/{DB_NAME}` · 테이블 `video_metadata` |
| INF-IFID-007 | Encoder | S3 Object Storage | S3 API | `{S3_ENDPOINT}/{Bucket}/{Key}` |
