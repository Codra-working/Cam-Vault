import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller('healthz')
export class HealthzController {
  constructor() {}
  @MessagePattern({ cmd: 'Get_healthz' })
  getHealthz() {
    return 'healthy';
  }
}
