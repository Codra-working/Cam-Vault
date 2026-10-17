import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DBService {
  constructor(
    @InjectRepository(VideoMetadata)
    private videoMetaRepo: Repository<VideoMetadata>,
    private configService: ConfigService,
  ) {}

  findAll(): Promise<VideoMetadata[]> {
    return this.videoMetaRepo.find();
  }

  findOne(id: string): Promise<VideoMetadata | null> {
    return this.videoMetaRepo.findOneBy({ id });
  }

  search(
    streamID: string,
    startedAt: string,
    endedAt: string,
  ): Promise<VideoMetadata[]> {
    const RTSPURL =
      this.configService.get<string[]>('recording.streams')![Number(streamID)];
    return this.videoMetaRepo
      .createQueryBuilder('VideoMetaData')
      .where('VideoMetaData.RTSPURL = :RTSPURL', { RTSPURL: RTSPURL })
      .andWhere('VideoMetaData.startedAt >= :startedAt', {
        startedAt: startedAt,
      })
      .andWhere('VideoMetaData.endedAt <= :endedAt', { endedAt: endedAt })
      .select([
        'VideoMetaData.Bucket',
        'VideoMetaData.Key',
        'VideoMetaData.segmentNumber',
      ])
      .orderBy('VideoMetaData.startedAt')
      .getMany();
  }

  save(
    record: Omit<VideoMetadata, 'id' | 'startedAt' | 'endedAt'> & {
      startedAt: string;
      endedAt: string;
    },
  ): Promise<VideoMetadata> {
    const {
      sessionID,
      RTSPURL,
      segmentNumber,
      Bucket,
      Key,
      startedAt,
      endedAt,
      isEncoded,
    } = record;
    if (
      !sessionID ||
      !RTSPURL ||
      isNaN(segmentNumber) ||
      !Bucket ||
      !Key ||
      !startedAt ||
      !endedAt
    ) {
      const something = !sessionID
        ? 'sessionID'
        : !RTSPURL
          ? 'RTSPURL'
          : isNaN(segmentNumber)
            ? 'segmentNumber'
            : !Bucket
              ? 'Bucket'
              : !Key
                ? 'Key'
                : !startedAt
                  ? 'startedAt'
                  : 'endedAt';

      const message = `DBService Error: ${something} is invalid.`;
      console.log(message);
      console.log(record);
      throw new Error(message);
    }
    const numStartedAt = new Date(startedAt).getTime();
    const numEndedAt = new Date(endedAt).getTime();

    const video = this.videoMetaRepo.create({
      sessionID,
      RTSPURL,
      segmentNumber,
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
