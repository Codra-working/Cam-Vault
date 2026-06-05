import { FormatInputPathObject } from "path";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class VideoMetadata{
    @PrimaryGeneratedColumn('uuid')
    id:string;
    @Column()
    filePath:string
    @Column({default: false})
    isEncoded:boolean
}