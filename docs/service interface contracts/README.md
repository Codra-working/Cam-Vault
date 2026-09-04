현재 폴더에서는 서비스간 인터페이스 계약에 대해 정의합니다.
인터페이스는 외부 인터페이스, 내부 인터페이스, 인프라 인터페이스로 구성됩니다.

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