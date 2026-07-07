import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RecordingController } from './recording.controller';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'RECORDING_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.getOrThrow<string>('recordingSvcOptions.host'),
            port: configService.getOrThrow<number>('recordingSvcOptions.port'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [RecordingController],
})
export class RecordingModule {}
