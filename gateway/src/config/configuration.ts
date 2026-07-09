import { Transport } from '@nestjs/microservices';

export default () => ({
  // db: {
  //   host: process.env.DB_HOST,
  //   port: Number(process.env.DB_PORT),
  //   username: process.env.DB_USERNAME,
  //   password: process.env.DB_PASSWORD,
  //   database: process.env.DB_NAME,
  //   synchronize: process.env.DB_SYNCHRONIZE,
  // },
  host: process.env.HOST,
  port: process.env.PORT,
  recordingSvcOptions: {
    transport: Transport.TCP,
    host: process.env.RECORDING_SERVICE_HOST,
    port: Number(process.env.RECORDING_SERVICE_PORT),
  },
  storage: {
    host: process.env.STORAGE_SERVICE_HOST,
    port: process.env.STORAGE_SERVICE_PORT,
  },
  videoMetadataService: {
    baseUrl: process.env.VIDEO_METADATA_SERVICE_BASE_URL,
  },
});
