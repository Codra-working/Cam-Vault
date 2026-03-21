import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DBService {
    constructor(
        @InjectRepository(VideoMetadata)
        private videoMetaRepo:Repository<VideoMetadata>,
    ){}

    async findAll():Promise<VideoMetadata[]>{
        return await this.videoMetaRepo.find();
    }

    findOne(id:number):Promise<VideoMetadata|null>{
        return this.videoMetaRepo.findOneBy({id})
    }

    save(fileName:string,fileDir:string):Promise<VideoMetadata>{
        const video = this.videoMetaRepo.create({fileName:fileName,fileDir:fileDir})
        return this.videoMetaRepo.save(video)
    }

    async remove(id:number):Promise<void>{
        await this.videoMetaRepo.delete(id);
    }
}
