const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export default () => ({
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseNumber(process.env.DB_PORT, 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_NAME ?? 'test',
    synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:15672',
    queue: process.env.ENCODING_QUEUE ?? 'encoding_queue',
  },
  targetDirectory:
    process.env.TARGET_DIRECTORY ?? '/app/storage/recordings/encoded',
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
});
