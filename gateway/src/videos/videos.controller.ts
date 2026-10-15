// import {
//   Controller, Delete, Get, Post,
// } from '@nestjs/common';
// import { ClientProxy } from '@nestjs/microservices';
// import RouteGenerator, { type autoGenerateRoutHandlerOptions } from '../utils/routeGenerator.js';

// @Controller('videos')
// export default class VideosController extends RouteGenerator {
//   constructor(client:ClientProxy) {
//     super(client);
//     const templits:autoGenerateRoutHandlerOptions[] = [
//       { HttpMethod: Get, path: '', toPayload: () => ({}) },
//       {
//         HttpMethod: Get, path: '', routeParameter: 'uuid', toPayload: (obj) => ({ uuid: obj.routeParameter }),
//       },
//     ];

//     for (let i = 0; i < templits.length; i++) {
//       this.addRoutHandler(templits[i]);
//     }
//   }
// }
