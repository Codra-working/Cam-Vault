import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('video_metadata')
export class VideoMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;
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
