import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import type { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { EncodingService } from './encoding.service';
import { DBService } from 'src/DB/DB.service';
import { Channel, Message } from 'amqplib';
import { Codec } from './ffmpegBuilder/FFMPEGBuilder';
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
        payload.Bucket,
        payload.Key,
        payload.codec as Codec,
      );
      console.log('Encoding Succeed');

      //add target metadata to DB
      // await this.dbService.save(
      //   path.parse(payload.absFilePath).name,
      //   path.parse(payload.absFilePath).dir,
      // );
      // console.log(`${payload.absFilePath} saved to DB`);

      //RabbitMQ ack
      channel.ack(context.getMessage() as Message);
      console.log(
        `Message sent to broker: ${JSON.stringify(context.getMessage())}`,
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
