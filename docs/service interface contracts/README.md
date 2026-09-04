# 인터페이스 계약 명세서

이 폴더에서는 시스템간 인터페이스 계약을 명시합니다.<br>
인터페이스는 외부 인터페이스, 내부 인터페이스, 인프라 인터페이스로 구성됩니다.<br>
아래의 그림을 참고해주세요.

```text
┌─ Client ─────────────────────────┐
│ User · Admin · RTSP Camera       │
└────────────────────────┬─────────┘
                         ⇅  External Interface
┌─ Internal Service ─────┴─────────┐    Infra Interface    ┌─ Infra ───────────────┐
│ Gateway · Recording              │◀─────────────────────▶│ RabbitMQ              │
│ Encoder · Metadata               │                       │ DB                    │
└────────┬───────────────▲─────────┘                       │ S3 Object Storage     │
         │               │                                 └───────────────────────┘
         └───────────────┘
          Internal Interface
```