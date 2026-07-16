import { CronExpression } from '@nestjs/schedule';

export type RecordingConfig = {
  host: string;
  port: number;
  streams: string[];
  cron: CronExpression;
  segmentLength: number;
  timeZone: string;
};
