import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DBService {
  constructor(
    @InjectRepository(VideoMetadata)
    private videoMetaRepo: Repository<VideoMetadata>,
  ) {}

  findAll(): Promise<VideoMetadata[]> {
    return this.videoMetaRepo.find();
  }

  findOne(id: string): Promise<VideoMetadata | null> {
    return this.videoMetaRepo.findOneBy({ id });
  }
  search(startedAt: string, endedAt: string): Promise<VideoMetadata[]> {
    return this.videoMetaRepo
      .createQueryBuilder('VideoMetaData')
      .where('VideoMetaData.startedAt >= :startedAt', { startedAt })
      .andWhere('VideoMetaData.endedAt <= :endedAt', { endedAt })
      .getMany();
  }
  save(
    Bucket: string,
    Key: string,
    startedAt: string,
    endedAt: string,
    isEncoded: boolean = false,
  ): Promise<VideoMetadata> {
    if (!Bucket || !Key || !startedAt || !endedAt) {
      const something = !Bucket ? 'Bucket' : !Key ? 'Key' : 'startedAt';
      const message = `DBService Error: ${something} is missing.`;
      console.log(message);
      throw new Error(message);
    }
    const numStartedAt = new Date(startedAt).getTime();
    const numEndedAt = new Date(endedAt).getTime();
    if (isNaN(numStartedAt) || isNaN(numEndedAt)) {
      const something = !numStartedAt ? 'startedAt' : 'endedAt';
      const value = isNaN(numStartedAt) ? startedAt : endedAt;
      const message = `DBService Error: ${something}(${value}) is incorrect.`;
      throw new Error(message);
    }
    const video = this.videoMetaRepo.create({
      Bucket,
      Key,
      startedAt: numStartedAt,
      endedAt: numEndedAt,
      isEncoded,
    });
    return this.videoMetaRepo.save(video);
  }

  async remove(id: string): Promise<void> {
    await this.videoMetaRepo.delete(id);
  }
}
