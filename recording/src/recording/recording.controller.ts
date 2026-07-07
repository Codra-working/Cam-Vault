import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';

@Controller()
export class RecordingController {}
