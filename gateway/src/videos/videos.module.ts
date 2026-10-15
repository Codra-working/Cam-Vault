import { Module } from '@nestjs/common';
// import { ClientsModule, Transport } from '@nestjs/microservices';
// import VideosController from './videos.controller.js';

@Module({
  imports: [
    // ClientsModule.register([
    //   { name: 'se', transport: Transport.TCP },
    // ]),
  ],
  // controllers: [VideosController],
})
export default class VideosModule {}
