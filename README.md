# Cam-Vault

Cam-Vault는 **RTSP 기반 CCTV 영상**을 녹화하고, 인코딩하고, 비디오 메타데이터를 관리하기 위한 서버입니다.

현재 저장소에는 백엔드 스택이 포함되어 있으며, 외부 요청은 `gateway` 서비스로 들어옵니다. 전체 시스템은 **Docker Compose**로 한 번에 실행할 수 있습니다.

---

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

camvault는 멀티 백엔드 서비스로 게이트웨이를 통해 다른 마이크로서비스로 접근하는 구조입니다.
각각의 마이크로서비스는 도커 스웜 환경에서 독립 서비스로 동작합니다.
하단은 camvault의 마이크로서비스 목록입니다.

- `gateway` (NestJS): REST API 게이트웨이 서비스
- `recording` (NestJS microservice): RTSP 동영상 스트림 녹화 서비스
- `encoder` (NestJS microservice): RabbitMQ 메시지를 받아 비디오 인코딩하는 서비스
- `video-metadata-service` (Spring Boot): 비디오 메타데이터 CRUD 서비스
- `mysql`: 비디오 메타데이터 저장
- `rabbitmq`: 비동기 메시지 브로커
- `storage`: S3객체 스토리지

> 게이트웨이와 마이크로서비스들은 도커 내부 네트워크로 연결되며, 기본 설정에서는 호스트 포트를 직접 열지 않습니다.

## API 문서

라이브 스트리밍 데모를 제외한 기능은 REST API로 제공됩니다.

**REST API**
[![Swagger UI](https://img.shields.io/badge/Swagger_UI-Open_Docs-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://codra-working.github.io/Cam-Vault/)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI_3.1-View_Spec-6BA539?style=flat-square&logo=openapiinitiative&logoColor=white)](https://github.com/Codra-working/Cam-Vault/blob/main/docs/openapi.yaml)

**라이브 스트리밍 데모**

`<라이브 스트리밍 데모>`
<br><br>

---

## 빠른 시작

### 0. 사전 요구사항

> 클러스터에 도커 스웜이 깔려있다는 전제 하에 설명하였습니다.
>
> 매니저 노드에서 다음 절차에 따라 명령어를 실행하시면 됩니다.

### 1. 컴포즈 파일 기반 실행

스택 파일(`cam-vault.stack.yaml`)기반으로 클러스터에 배포합니다.(`http://localhost:3000`에서 서버가 시작됩니다.)

```bash
sudo docker stack deploy --compose-file cam-vault.stack.yaml camvault
```

### 2. 상태 확인

현재 클러스터에 배포된 스택을 확인합니다.

```bash
sudo docker stack ps camvault
```

### 3. 종료

클러스터에서 배포된 스택을 제거합니다.

```bash
sudo docker stack rm camvault
```

