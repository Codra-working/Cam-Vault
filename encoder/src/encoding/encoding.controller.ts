import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import type{ EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { EncodingService } from './encoding.service';
import * as fsPromise from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import { DBModule } from 'src/DB/DB.module';
import { DBService } from 'src/DB/DB.service';
import path from 'node:path';
@Controller('encoding')
export class EncodingController {
    constructor(private encoder:EncodingService, private configService :ConfigService, private videoRecord:DBService){}

    @MessagePattern('encoding_request')
    async consumeEncodingRequest(@Payload() payload: EncodingRequestDTO, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef()
        try {
            const encoderLog = await this.encoder.encode(payload.absFilePath, payload.codec, payload.fileFormat, this.configService.get<string>('targetDirectory')!)
            console.log(encoderLog==undefined?'Encoding Sucess':encoderLog)
            const rmDirLog = await fsPromise.rm(payload.absFilePath)
            console.log(rmDirLog==undefined?'file deletion Success':rmDirLog)
            channel.ack(context.getMessage())
            this.videoRecord.save(path.basename(payload.absFilePath),path.dirname(payload.absFilePath))
            return {encoderLog,rmDirLog}
        } catch (error) {
            console.error("Error: ",error)
            return error
        }
    }
}
