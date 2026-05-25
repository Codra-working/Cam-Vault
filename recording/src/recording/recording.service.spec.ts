import { Test, TestingModule } from '@nestjs/testing';
import { RecordingService } from './recording.service';
import { ClientsModule, ClientProxy, Transport } from '@nestjs/microservices';
import { ModuleMocker, MockMetadata } from 'jest-mock';


const moduleMocker = new ModuleMocker(global);

describe('RecordingService', () => {
  let client: ClientProxy
  let recordingService: RecordingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordingService,
        {
          provide: 'RMQ_SERVICE',
          useValue: {
            emit: jest.fn(),
            send: jest.fn(),
          },
        }
      ],
    }).useMocker((token) => {
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata(
          token,
        ) as MockMetadata<any>;
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);
        return new Mock();
      }
    }).compile();

    client = module.get('RMQ_SERVICE')
    recordingService = module.get(RecordingService);
  });

  it('should be defined', () => {
    expect(recordingService).toBeDefined();
  });

  //null, undefined, nan 테스트
});
