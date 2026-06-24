import * as path from 'node:path';
export interface EncodingRequestDTO {
  filePath: path.FormatInputPathObject;
  codec: string;
}
