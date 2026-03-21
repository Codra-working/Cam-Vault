import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EncodeService } from './encode.service';
@Module({
  controllers: [],
  providers: [EncodeService]
})
export class EncodeModule {}
