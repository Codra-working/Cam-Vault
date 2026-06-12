import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class DBService {
  constructor(
    @InjectRepository(VideoMetadata)
    private repository: Repository<VideoMetadata>,
  ) {}

  findAll(): Promise<VideoMetadata[]> {
    return this.repository.find();
  }

  findOne(id: string): Promise<VideoMetadata | null> {
    return this.repository.findOneBy({ id: id });
  }

  save(fileName: string, fileDir: string): Promise<VideoMetadata> {
    const video = this.repository.create({
      fileName: fileName,
      fileDir: fileDir,
    });
    return this.repository.save(video);
  }

  remove(id: string): Promise<DeleteResult> {
    return this.repository.delete(id);
  }
}
