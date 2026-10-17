import {
  AppModule as RecordingAppModule,
  NestFactory as RecordingNestFactory,
  Transport,
  type MicroserviceOptions,
} from '@cam-vault/recording';
import {
  AppModule as GatewayAppModule,
  NestFactory as GatewayNestFactory,
  type NestExpressApplication,
} from '@cam-vault/gateway';
import {
  describe, test, expect, beforeAll, afterAll,
} from '@jest/globals';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { afterEach, beforeEach } from 'node:test';
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

  const gateway = await GatewayNestFactory.create<NestExpressApplication>(GatewayAppModule, {
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
  let gateway: NestExpressApplication | undefined;
  let recording: Awaited<ReturnType<typeof RecordingNestFactory.createMicroservice>> | undefined;

  beforeAll(async () => {
    ({ gateway, recording } = await bootstrap());// 게이트웨이를 기다려야됨
  }, 30000);
  afterAll(async () => {
    await gateway.close();
    await recording.close();
    await shutdown();
  });

  test.each(testSuite)('$httpMethod $url', async (testCase:RESTAPI) => {
    const {
      httpMethod, url, reqBody, response,
    } = testCase;
    const res = await fetch(`http://${process.env.GATEWAY_TCP_HOST}:${process.env.GATEWAY_TCP_PORT}${url}`, {
      method: httpMethod.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        reqBody,
      ),
    });
    expect(await res.status).toBe(200);
  }, 30000);

  test('recordingservice should be healty', async () => {
    const res = await fetch(`http://${process.env.GATEWAY_TCP_HOST}:${process.env.GATEWAY_TCP_PORT}/recording/healthz`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('healthy');
  });
});
