import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
describe('ConfigController', () => {
  let controller: ConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
      ],
      controllers: [ConfigController],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
  });

  it('should be defined', () => {
    console.log();
    expect(controller).toBeDefined();
  });
});
