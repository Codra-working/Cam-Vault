import {
  describe, test, expect, beforeAll, afterAll,
} from '@jest/globals';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';
import {
  AppModule as RecordingAppModule,
  NestFactory as RecordingNestFactory,
  Transport,
  type MicroserviceOptions,
} from '@cam-vault/recording/src/index.ts';
import {
  AppModule as GatewayAppModule,
  NestFactory as GatewayNestFactory,
  NestApplication,
} from '@cam-vault/gateway/src/index.ts';
import getApiExample, { type RESTAPI } from './lib/getTestSuit.ts';

async function bootstrap() {
  const proc = spawn('docker', ['compose', 'up', '-d']);
  const print = (data:Buffer) => console.log(data.toString());
  proc.stdout.addListener('data', print);
  proc.stderr.addListener('data', print);

  const semaphor = new Promise((resolve) => {
    proc.on('close', () => resolve('void'));// continue
  });
  await semaphor;
  // 좀비 프로세스 종료 필요
  // child 프로세스 추적할 방법이 필요함

  const gateway = await GatewayNestFactory.create<NestApplication>(GatewayAppModule, {
    abortOnError: false,
  });
  const recording = await RecordingNestFactory.createMicroservice<MicroserviceOptions>(
    RecordingAppModule,
    {
      abortOnError: false,
      transport: Transport.TCP,
      options: {
        host: process.env.RECORDING_TCP_HOST,
        port: Number.parseInt(
          process.env.RECORDING_TCP_PORT!,
          10,
        ),
      },
    },
  );
  await Promise.all([gateway, recording]);
  gateway.useStaticAssets(fileURLToPath(new URL('./docs', import.meta.url)), { prefix: '/api' });
  gateway.enableCors({
    origin: ['null', 'https://codra-working.github.io'],
    methods: ['GET', 'POST', 'DELETE'],
  });

  await recording.listen();
  await gateway.listen(Number(process.env.GATEWAY_TCP_PORT), process.env.GATEWAY_TCP_HOST!);
  // 인코더 추가
  return { gateway, recording };
}
async function shutdown() {
  const proc = spawn('docker', ['compose', 'down']);

  await new Promise((resolve) => {
    proc.on('close', () => { resolve(''); });
  });
}
describe('Cam-Vault RestAPI test', () => {
  const openAPIYaml = path.join(
    import.meta.dirname,
    '..',
    'docs',
    'openapi.yaml',
  );
  const testSuite = getApiExample(openAPIYaml);
  let gateway: NestApplication;
  let recording: Awaited<ReturnType<typeof RecordingNestFactory.createMicroservice>>;

  beforeAll(async () => {
    ({ gateway, recording } = await bootstrap());//
  }, 30000);

  afterAll(async () => {
    await gateway.close();
    await recording.close();
    await shutdown();
  });

  test.each(testSuite)('$httpMethod $url $reqBody', async (testCase:RESTAPI) => {
    const {
      httpMethod, url, reqBody,
    } = testCase;
    const res = await fetch(`http://${process.env.GATEWAY_TCP_HOST}:${process.env.GATEWAY_TCP_PORT}${url}`, {
      method: httpMethod.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    });

    // sender와 receiver 로그메시지 출력하기
    // 리시버 쪽은 파이프 전 메시지와 파이프 후의 메시지를 훅을 걸어서 출력
    // jest로 e2e를 한 이유: 도커로 하면 훅을 못걸음
    if (url !== '/auth/profile') expect([200, 201]).toContain(res.status);

    console.log(res.body);
  }, 40000);

  test('recordingservice should be healty', async () => {
    const res = await fetch(`http://${process.env.GATEWAY_TCP_HOST}:${process.env.GATEWAY_TCP_PORT}/recording/healthz`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('healthy');
  });
});
