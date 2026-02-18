import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos/videos.controller';
import { VideosService } from './videos/videos.service';

describe('AppController', () => {
  let appController: VideosController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [VideosService],
    }).compile();

    appController = app.get<VideosController>(VideosController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {

    });
  });
});
