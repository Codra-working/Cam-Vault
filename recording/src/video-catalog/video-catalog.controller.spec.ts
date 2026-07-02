import { Test, TestingModule } from '@nestjs/testing';
import { VideoCatalogController } from './video-catalog.controller';

describe('VideoCatalogController', () => {
  let controller: VideoCatalogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoCatalogController],
    }).compile();

    controller = module.get<VideoCatalogController>(VideoCatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
