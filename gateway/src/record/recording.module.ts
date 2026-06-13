import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'RECORDING_SERVICE',
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: (await configService['recordingservice.host']) as string,
            port: (await configService['recordingservice.number']) as number,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
})
export class RecordingModule {}
