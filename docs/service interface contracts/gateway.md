# Gateway 인터페이스 계약 명세서

이 문서는 `Gateway`서비스의 인터페이스를 정의합니다.

## 외부 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 엔드포인트 |
|---|---|---|---|---|
| EX-IFID-001 | Client | Gateway | HTTP REST | `GET /recording/config` |
| EX-IFID-002 | Client | Gateway | HTTP REST | `GET /recording/healthz` |
| EX-IFID-003 | Client | Gateway | HTTP REST | `GET /recording/config/rtsp/urls` |
| EX-IFID-004 | Client | Gateway | HTTP REST | `POST /recording/config/rtsp/urls` |
| EX-IFID-005 | Client | Gateway | HTTP REST | `GET /recording/config/rtsp/urls/{id}` |
| EX-IFID-006 | Client | Gateway | HTTP REST | `DELETE /recording/config/rtsp/urls/{id}` |
| EX-IFID-007 | Client | Gateway | HTTP REST | `GET /recording/config/segmentLength` |
| EX-IFID-008 | Client | Gateway | HTTP REST | `POST /recording/config/segmentLength` |
| EX-IFID-009 | Client | Gateway | HTTP REST | `GET /recording/config/Bucket` |
| EX-IFID-010 | Client | Gateway | HTTP REST | `POST /recording/config/Bucket` |
| EX-IFID-011 | Client | Gateway | HTTP REST | `GET /recording/config/rabbitmq/urls` |
| EX-IFID-012 | Client | Gateway | HTTP REST | `GET /recording/video-catalog/{streamID}?start={start}&end={end}` |
| EX-IFID-013 | Client | Gateway | HTTP REST | `GET /recording/videos/{id}` |
| EX-IFID-014 | Client | Gateway | HTTP REST | `GET /videos` |
| EX-IFID-015 | Client | Gateway | HTTP REST | `POST /videos` |
| EX-IFID-016 | Client | Gateway | HTTP REST | `GET /videos/{uuid}` |
| EX-IFID-017 | Client | Gateway | HTTP REST | `DELETE /videos/{uuid}` |
| EX-IFID-018 | Client | Gateway | HTTP REST | `GET /videos/{uuid}/encoding-status` |

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

## 인프라 인터페이스

| ID | 요청자 | 수신자 | 프로토콜 | 엔드포인트 |
|---|---|---|---|---|
| - | - | - | - | 해당 없음 |
