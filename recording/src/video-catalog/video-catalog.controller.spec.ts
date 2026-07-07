import { Test, TestingModule } from '@nestjs/testing';
import { VideoCatalogController } from './video-catalog.controller';
import { Provider } from '@nestjs/common';
import { DBService } from 'src/DB/DB.service';
import { ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);
type Constructor = new (...args: any[]) => any;
function isConstructor(value: unknown): value is Constructor {
  if (typeof value !== 'function') {
    return false;
  }
  try {
    Reflect.construct(String, [], value);
    return true;
  } catch (e) {
    return false;
  }
}
const dbService: Provider = {
  provide: DBService,
  useValue: {
    search: jest.fn(),
  },
};
describe('VideoCatalogController', () => {
  let controller: VideoCatalogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoCatalogController],
      providers: [dbService],
    })
      .useMocker((token) => {
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token);
          if (mockMetadata !== null) {
            const Mock = moduleMocker.generateFromMetadata(mockMetadata);
            if (isConstructor(Mock)) return new Mock();
          }
          return;
        }
      })
      .compile();

    controller = module.get<VideoCatalogController>(VideoCatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
