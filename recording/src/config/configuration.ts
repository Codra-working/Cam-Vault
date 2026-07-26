import { RecordingConfig } from './type/recording.config';
import { DatabaseConfig } from './type/database.config';
import { RabbitmqConfig } from './type/rabbitmq.config';
import { StorageConfig } from './type/storage.config';
import { parseToInteger, parseStreams } from '../common/utils/parse';
import { CronExpression } from '@nestjs/schedule';
//나중에 디폴트값 분리

export default () => {
  const recordingConfig: { recording: RecordingConfig } & {
    db: DatabaseConfig;
  } & {
    rabbitmq: RabbitmqConfig;
  } & { storage: StorageConfig } = {
    recording: {
      host: process.env.RECORDING_TCP_HOST!,
      port: Number(process.env.RECORDING_TCP_PORT!),
      streams: parseStreams(process.env.RECORDING_STREAMS!), //url 검사
      cron: process.env.RECORDING_CRON as CronExpression,
      segmentLength: parseToInteger(process.env.RECORDING_SEGMENT_LENGTH!),
      timeZone: process.env.RECORDING_TZ!,
    },

    db: {
      host: process.env.DB_HOST!, //url 검사
      port: parseToInteger(process.env.DB_PORT!),
      name: process.env.DB_NAME!,
      username: process.env.DB_USERNAME!,
      password: process.env.DB_PASSWORD!,
      synchronize: process.env.DB_SYNCHRONIZE! === 'true',
    },
    rabbitmq: {
      urls: process.env.RMQ_URL!,
      queues: process.env.RMQ_QUEUE_NAME!,
    },
    storage: {
      endpoint: process.env.S3_ENDPOINT!,
      region: process.env.S3_REGION!,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE! === 'true',
      useDualstackEndpoint: process.env.S3_USE_DUALSTACK_ENDPOINT! === 'true',
      targetDir: process.env.S3_TARGET_DIR!,
      responseChecksumValidation: process.env.S3_RESPONSE_CHECKSUM_VALIDATION!,
      requestChecksumCalculation: process.env.S3_REQUEST_CHECKSUM_CALCULATION!,
      credentialsAccessKeyID: process.env.S3_CREDENTIALS_ACCESS_KEY_ID!,
      credentialSecretAccessKey: process.env.S3_CREDENTIALS_SECRET_ACCESS_KEY!,
    },
  };
  return recordingConfig;
};
