import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import {
  ModuleMocker,
  MockedObject,
  mocked,
  MockMetadata,
  MockMetadataType,
  MockedClass,
} from 'jest-mock';
import { DBService } from './DB.service';
import { Inject, InjectionToken, Provider } from '@nestjs/common';
import { VideoMetadata } from './videoMetadata.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TestingInjector } from '@nestjs/testing/testing-injector';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

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

const ConfigServiceProvider = {
  provide: ConfigService,
  useValue: {
    get: jest.fn(),
  },
};

async function buildTestModule() {
  const module = await Test.createTestingModule({
    providers: [DBService, ConfigServiceProvider],
  })
    .useMocker(function (this: TestingInjector, token) {
      if (token === getRepositoryToken(VideoMetadata)) {
        return {
          find: jest.fn(),
          findAll: jest.fn(),
          findOneBy: jest.fn(),
          create: jest.fn().mockReturnValue('test'),
          save: jest.fn(),
          delete: jest.fn(),
        };
      }
    })
    .compile();
  return module;
}
function getProviders(
  module: TestingModule,
  providerNames: string[],
): MockedObject<any> {
  providerNames.forEach((name) => {
    module.get(name);
  });
}

describe('DBService.findAll', () => {
  let repository;
  let dbService;
  beforeEach(async () => {
    const module = await buildTestModule();
    dbService = module.get(DBService);
    repository = module.get(getRepositoryToken(VideoMetadata));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should call repository.find', () => {
    dbService.findAll();
    expect(dbService).toBeDefined();
    expect(repository.find).toHaveBeenCalled();
  });
});

describe('DBService.findOne', () => {
  let repository;
  let dbService;
  beforeEach(async () => {
    const module = await buildTestModule();
    dbService = module.get(DBService);
    repository = module.get(getRepositoryToken(VideoMetadata));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should initialize DB service and repository', () => {
    expect(dbService).toBeDefined();
    expect(repository).toBeDefined();
  });

  test('should call repository.findOneBy with the given id', () => {
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    dbService.findOne(id);
    expect(repository.findOneBy).toHaveBeenNthCalledWith(1, { id });
  });
});

describe('DBService.save', () => {
  let repository;
  let dbService;
  beforeEach(async () => {
    const module = await buildTestModule();
    dbService = module.get(DBService);
    repository = module.get(getRepositoryToken(VideoMetadata));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should initialize DB service and repository', () => {
    expect(dbService).toBeDefined();
    expect(repository).toBeDefined();
  });

  test('should save created video metadata', () => {
    dbService.save({
      sessionID: 'testSessionID',
      RTSPURL: 'testRTSPURL',
      segmentNumber: 10,
      Bucket: 'testBucket',
      Key: 'testKey',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      isEncoded: false,
    });
    expect(repository.save).toHaveBeenNthCalledWith(1, 'test');
  });
});

describe('DBService.remove', () => {
  let repository;
  let dbService;
  beforeEach(async () => {
    const module = await buildTestModule();
    dbService = module.get(DBService);
    repository = module.get(getRepositoryToken(VideoMetadata));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should initialize DB service and repository', () => {
    expect(dbService).toBeDefined();
    expect(repository).toBeDefined();
  });

  test('should delete video metadata by id', () => {
    const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    dbService.remove(id);
    expect(repository.delete).toHaveBeenNthCalledWith(1, id);
  });
});
