import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { DBService } from './DB.service';
import { Repository } from 'typeorm';
//this test does not test TypeOrmModule

const videoMetadata: VideoMetadata = {
  id: 'testUUID',
  fileName: 'test.mp4',
  fileDir: '/videos',
};

const init = async () => {
  const mockRepository: Partial<jest.Mocked<Repository<VideoMetadata>>> = {
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
  };
  const moduleRef = await Test.createTestingModule({
    providers: [
      DBService,
      {
        provide: getRepositoryToken(VideoMetadata),
        useValue: mockRepository,
      },
    ],
  }).compile();
  const dbService = moduleRef.get(DBService);
  const repository = moduleRef.get<jest.Mocked<Repository<VideoMetadata>>>(
    getRepositoryToken(VideoMetadata),
  );
  return { moduleRef, dbService, repository };
};

describe('findAll()', () => {
  let moduleRef: TestingModule;
  let dbService: DBService;
  let repository: jest.Mocked<Repository<VideoMetadata>>;

  beforeEach(async () => {
    const setup = await init();
    moduleRef = setup.moduleRef;
    dbService = setup.dbService;
    repository = setup.repository;
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await moduleRef.close();
  });

  test('should instantiate repository', () => {
    expect(repository).toBeDefined();
  });

  test('should return all VideoMetadata', async () => {
    const expectedVideos = [videoMetadata];
    repository.find.mockResolvedValue(expectedVideos);

    await expect(dbService.findAll()).resolves.toBe(expectedVideos);
  });

  test('should return promise result when repository rejected', async () => {
    repository.find.mockRejectedValue('find() rejected');

    await expect(dbService.findAll()).rejects.toBe('find() rejected');
  });
});

describe('findOne()', () => {
  let moduleRef: TestingModule;
  let dbService: DBService;
  let repository: jest.Mocked<Repository<VideoMetadata>>;

  beforeEach(async () => {
    const setup = await init();
    moduleRef = setup.moduleRef;
    dbService = setup.dbService;
    repository = setup.repository;
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await moduleRef.close();
  });

  test('should instantiate repository', () => {
    expect(repository).toBeDefined();
  });

  test('should call repository.finOneBy with correct ID', async () => {
    const ID = 'testUUID';
    const spy = jest.spyOn(repository, 'findOneBy');
    await dbService.findOne(ID);

    expect(spy).toHaveBeenNthCalledWith(1, { id: ID });
  });

  test('should return VideoMetadata that matches ID', async () => {
    const ID = 'testUUID';
    repository.findOneBy.mockResolvedValue(videoMetadata);

    await expect(dbService.findOne(ID)).resolves.toBe(videoMetadata);
  });

  test('should return null when there are no data', async () => {
    const ID = 'testUUID';
    repository.findOneBy.mockResolvedValue(null);

    await expect(dbService.findOne(ID)).resolves.toBeNull();
  });

  test('should return promise result when repository rejected', async () => {
    const ID = 'testUUID';
    repository.findOneBy.mockRejectedValue('findOneBy() rejected');

    await expect(dbService.findOne(ID)).rejects.toBe('findOneBy() rejected');
  });
});

describe('save()', () => {
  let moduleRef: TestingModule;
  let dbService: DBService;
  let repository: jest.Mocked<Repository<VideoMetadata>>;

  beforeEach(async () => {
    const setup = await init();
    moduleRef = setup.moduleRef;
    dbService = setup.dbService;
    repository = setup.repository;
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await moduleRef.close();
  });

  test('should instantiate repository', () => {
    expect(repository).toBeDefined();
  });

  test('should call repsitory.create with correct argument', async () => {
    const spy = jest.spyOn(repository, 'create');
    repository.create.mockReturnValue(videoMetadata);
    await dbService.save(videoMetadata.fileName, videoMetadata.fileDir);

    expect(spy).toHaveBeenNthCalledWith(1, {
      fileName: videoMetadata.fileName,
      fileDir: videoMetadata.fileDir,
    });
  });

  test('should return videoMetadata which is saved', async () => {
    const createSpy = jest
      .spyOn(repository, 'create')
      .mockReturnValueOnce(videoMetadata);
    const saveSpy = jest.spyOn(repository, 'save');
    repository.save.mockResolvedValue(videoMetadata);
    const result = await dbService.save(
      videoMetadata.fileName,
      videoMetadata.fileDir,
    );

    expect(createSpy).toHaveBeenNthCalledWith(1, {
      fileName: videoMetadata.fileName,
      fileDir: videoMetadata.fileDir,
    });
    expect(saveSpy).toHaveBeenNthCalledWith(1, videoMetadata);
    expect(result).toBe(videoMetadata);
  });

  test('should return promise result when repository rejected', async () => {
    repository.save.mockRejectedValue('save() rejected');

    await expect(
      dbService.save(videoMetadata.fileName, videoMetadata.fileDir),
    ).rejects.toBe('save() rejected');
  });
});

describe('remove()', () => {
  let moduleRef: TestingModule;
  let dbService: DBService;
  let repository: jest.Mocked<Repository<VideoMetadata>>;

  beforeEach(async () => {
    const setup = await init();
    moduleRef = setup.moduleRef;
    dbService = setup.dbService;
    repository = setup.repository;
  });

  afterEach(async () => {
    jest.resetAllMocks();
    await moduleRef.close();
  });

  test('should instantiate repository', () => {
    expect(repository).toBeDefined();
  });

  test('should call repsitory.delete with correct argument', async () => {
    const spy = jest.spyOn(repository, 'delete');
    await dbService.remove(videoMetadata.id);

    expect(spy).toHaveBeenNthCalledWith(1, videoMetadata.id);
  });

  test('should return delete result ', async () => {
    repository.delete.mockResolvedValue({ raw: videoMetadata });

    await expect(dbService.remove(videoMetadata.id)).resolves.toEqual({
      raw: videoMetadata,
    });
  });

  test('should reject when repository rejects ', async () => {
    const repositoryError = new Error('repository error');
    repository.delete.mockRejectedValue(repositoryError);

    await expect(dbService.remove(videoMetadata.id)).rejects.toEqual(
      repositoryError,
    );
  });
});
