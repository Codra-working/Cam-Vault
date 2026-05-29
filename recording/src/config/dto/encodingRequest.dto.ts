import * as path from 'node:path'
export interface EncodingRequestDTO{
    filePath:path.ParsedPath
    codec:string
}