import { Test, TestingModule } from '@nestjs/testing';
import { EncodingController } from './encoding.controller';

describe('EncodingController', () => {
  let controller: EncodingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EncodingController],
    }).compile();

    controller = module.get<EncodingController>(EncodingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
