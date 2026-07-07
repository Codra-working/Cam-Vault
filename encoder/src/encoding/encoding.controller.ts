import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import type { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { EncodingService } from './encoding.service';
import * as fsPromise from 'node:fs/promises';
import { DBService } from 'src/DB/DB.service';
import path from 'node:path';
import { Channel, Message } from 'amqplib';
@Controller('encoding')
export class EncodingController {
  constructor(
    private encodingService: EncodingService,
    private dbService: DBService,
  ) {}

  @MessagePattern('encoding_request')
  async consumeEncodingRequest(
    @Payload() payload: EncodingRequestDTO,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef() as Channel;

    try {
      //encode source to target
      console.log('Encoding started');
      await this.encodingService.encode(
        path.parse(payload.absFilePath),
        payload.codec,
        payload.fileFormat,
      );
      console.log('Encoding Succeed');

      //remove source
      await fsPromise.rm(payload.absFilePath);
      console.log(`${payload.absFilePath} deleted successfully`);

      //add target metadata to DB
      await this.dbService.save(
        path.parse(payload.absFilePath).name,
        path.parse(payload.absFilePath).dir,
      );
      console.log(`${payload.absFilePath} saved to DB`);

      //RabbitMQ ack
      channel.ack(context.getMessage() as Message);
      console.log(
        `Message sent to brocker: ${JSON.stringify(context.getMessage())}`,
      );
    } catch (error) {
      //RabbitMQ reject
      channel.reject(context.getMessage() as Message);
      console.log(
        `Message rejected to brocker: ${JSON.stringify(context.getMessage())}`,
      );
      console.log(`Encoding Error: ${error}`);
    }
  }
}
