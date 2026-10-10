import { ChildProcessWithoutNullStreams } from 'child_process';
import { RTSPClient } from 'yellowstone';
import { EncodingContext } from '../ffmpegBuilder/FFMPEGBuilder';

export default abstract class RecordingProcessFactory {
  abstract create(
    context: EncodingContext,
  ): ChildProcessWithoutNullStreams | Promise<RTSPClient>;
}
