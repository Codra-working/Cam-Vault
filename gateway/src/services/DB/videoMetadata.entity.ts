import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class VideoMetadata{
    @PrimaryGeneratedColumn('uuid')
    id:number;
    @Column()
    fileName:string
    @Column()
    fileDir:string
}