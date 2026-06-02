import { Test, TestingModule, TestingModuleBuilder } from "@nestjs/testing";
import { ModuleMocker, MockedObject, mocked, MockMetadata, MockMetadataType, MockedClass } from "jest-mock";
import { DBService } from "./DB.service";
import { Inject, InjectionToken, Provider } from "@nestjs/common";
import { VideoMetadata } from "./videoMetadata.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { TestingInjector } from '@nestjs/testing/testing-injector';
import { DataSource, Repository } from "typeorm";

const moduleMocker = new ModuleMocker(global)
type Constructor = new (...args: any[]) => any;

function isConstructor(value: unknown): value is Constructor {
    if (typeof value !== 'function') {
        return false
    }
    try {
        Reflect.construct(String, [], value)
        return true
    } catch (e) {
        return false
    }
}

async function buildTestModule() {
    const module = await Test.createTestingModule({
        providers: [DBService]
    })
        .useMocker(function (this: TestingInjector, token) {
            if (token === getRepositoryToken(VideoMetadata)) {
                // console.log(token)
                // console.log('useMocker this constructor:', this?.constructor?.name)

                // for (const module of this.container.getModules().values()) {
                //     const moduleName: string = module.name
                //     const providers: any[] = []
                //     module.providers.forEach((token, instanceWrapper) => { providers.push(token.name) })
                //     console.log(`module name: ${moduleName}`)
                //     console.log(`providers: ${providers}`)
                // }
                return {
                    find: jest.fn(),
                    findAll: jest.fn(),
                    findOneBy: jest.fn(),
                    create: jest.fn().mockReturnValue('test'),
                    save: jest.fn(),
                    delete: jest.fn(),
                }
            }
        })
        .compile()
    return module
}
function getProviders(module: TestingModule, providerNames: string[]): MockedObject<any> {
    return providerNames.forEach((name) => module.get(name))
}

describe('find all videoMetadata', () => {
    let repository
    let dbService
    beforeEach(async () => {
        const module = await buildTestModule()
        dbService = module.get(DBService)
        repository = module.get(getRepositoryToken(VideoMetadata))
    })

    afterEach(() => {
        jest.resetAllMocks();
    })

    test('reads all data from repo', () => {
        dbService.findAll()
        expect(dbService).toBeDefined()
        expect(repository.find).toHaveBeenCalled()
    })
})

describe('find videoMetadata that matches ID', () => {
    let repository
    let dbService
    beforeEach(async () => {
        const module = await buildTestModule()
        dbService = module.get(DBService)
        repository = module.get(getRepositoryToken(VideoMetadata))
    })

    afterEach(() => {
        jest.resetAllMocks();
    })

    test('to be defined', () => {
        expect(dbService).toBeDefined()
        expect(repository).toBeDefined()
    })

    test('reads all data from repo', () => {
        const id=Math.floor(Math.random()*Number.MAX_SAFE_INTEGER)
        dbService.findOne(id)
        expect(repository.findOneBy).toHaveBeenNthCalledWith(1,{id})
    })
})

describe('save videoMetadata', () => {
    let repository
    let dbService
    beforeEach(async () => {
        const module = await buildTestModule()
        dbService = module.get(DBService)
        repository = module.get(getRepositoryToken(VideoMetadata))
    })

    afterEach(() => {
        jest.resetAllMocks();
    })

    test('to be defined', () => {
        expect(dbService).toBeDefined()
        expect(repository).toBeDefined()
    })

    test('to be saved', () => { 
        dbService.save('fileName','fileDir')
        expect(repository.save).toHaveBeenNthCalledWith(1,'test')
    })
})

describe('remove videoMetadata that matches ID', () => {
    let repository
    let dbService
    beforeEach(async () => {
        const module = await buildTestModule()
        dbService = module.get(DBService)
        repository = module.get(getRepositoryToken(VideoMetadata))
    })

    afterEach(() => {
        jest.resetAllMocks();
    })

    test('to be defined', () => {
        expect(dbService).toBeDefined()
        expect(repository).toBeDefined()
    })

    test('to be removed', () => { 
        const id=Math.floor(Math.random()*Number.MAX_SAFE_INTEGER)
        dbService.remove(id)
        expect(repository.delete).toHaveBeenNthCalledWith(1,id)
    })
})

