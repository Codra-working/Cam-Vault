import { Codec } from 'src/encoding/ffmpegBuilder/FFMPEGBuilderStrategy';

export interface EncodingRequestDTO {
  absFilePath: string;
  codec: Codec;
  fileFormat: string;
}
