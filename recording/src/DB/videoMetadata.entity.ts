import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('video_metadata')
export class VideoMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  RTSPURL: string;
  @Column()
  sessionID: string;
  @Column()
  segmentNumber: number;
  @Column()
  Bucket: string;
  @Column()
  Key: string;
  @Column({ type: 'bigint' })
  startedAt: number;
  @Column({ type: 'bigint' })
  endedAt: number;
  @Column()
  isEncoded: boolean;
}
