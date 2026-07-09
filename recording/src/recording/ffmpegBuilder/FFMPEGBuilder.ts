import { Injectable } from '@nestjs/common';
import { EncodingProcessBuilderStrategy } from './FFMPEGBuilderStrategy';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

export type VideoSource = {
  option: string | null;
  value: string;
  isVideoSource: boolean;
};
export type Options = Map<string, string>;
export type Specs = Map<VideoSource, Options>;

export type Codec =
  'copy' | 'libx264' | 'libx265' | 'h264_nvenc' | 'hevc_nvenc';
export type EncodingContext = {
  inputs: string[];
  outputs: string[];
  codec: Codec;
  segmentLen?: number;
  segmentInfoFile?: string;
};

export type FFMPEGBuildSpec = {
  strategy: EncodingProcessBuilderStrategy<FFMPEGProcessBuilder>;
  context: EncodingContext;
};

export abstract class EncodingProcessBuilder {
  abstract build(): ChildProcessWithoutNullStreams;
  abstract applyStrategy(
    strategy: EncodingProcessBuilderStrategy<this>,
    context: EncodingContext,
  ): this;
}

@Injectable()
export class FFMPEGProcessBuilder extends EncodingProcessBuilder {
  private globalOptions: Options = new Map();
  private filterOptions: Options = new Map();
  private inSpec: Specs = new Map();
  private outSpec: Specs = new Map();
  private inOptions: Options = new Map();
  private outOptions: Options = new Map();
  private inputStream: VideoSource;
  private outputStream: VideoSource;
  private defultYesFlag: boolean = true;
  private argRef: string[];
  inStream(source: string) {
    this.inputStream = { option: '-i', value: source, isVideoSource: true };
    return this;
  }

  outStream(source: string) {
    this.outputStream = { option: null, value: source, isVideoSource: true };
    return this;
  }

  addGlobalOption(key: string, value: string): this {
    this.globalOptions.set(key, value);
    return this;
  }

  addFilterOption(key: string, value: string): this {
    this.filterOptions.set(key, value);
    return this;
  }

  // addInputSpec(videoSource: VideoSource): FFMPEGBuilder {
  //     this.inSpec.set(videoSource, this.inOptions)
  //     this.outOptions = new Map()
  //     return this
  // }

  inputOption(key: string, value: string): this {
    this.inOptions.set(key, value);
    return this;
  }

  timeout(time: number): this {
    this.inOptions.set('-timeout', time.toString(10));
    return this;
  }

  // addOutputSpec(videoSource: VideoSource): FFMPEGBuilder {
  //     this.outSpec.set(videoSource, this.outOptions)
  //     this.outOptions = new Map()
  //     return this
  // }

  outputOption(key: string, value: string): this {
    this.outOptions.set(key, value);
    return this;
  }

  map(index: number): this {
    this.outOptions.set('-map', index.toString(10));
    return this;
  }

  codec(codec: Codec): this {
    this.outOptions.set('-c', codec);
    return this;
  }

  commit() {
    if (!this.inputStream || !this.outputStream) {
      throw new Error('input and output streams must be set before save()');
    }
    this.inSpec.set(this.inputStream, this.inOptions);
    this.outSpec.set(this.outputStream, this.outOptions);
    this.inOptions = new Map();
    this.outOptions = new Map();

    return this;
  }

  /**
   * print a node if it is not an instance of Map (special symbols are considered as a instance of a Map)
   * parent node contains a list of (key,value)pair and each (key,value)pair is a child node of a parent
   * if a node is a map, the (key,value) pair of the map will be visted in order with the number of registration, except when isVideoSoure() is true
   * so if a node is videoSource it will be visited last, only if they share a same parent node
   * @param node node to be visited
   * @param ret order of nodes which is going to be visited
   */
  private isVideoSource(value: any): value is VideoSource {
    if (
      Object.getOwnPropertyNames(value).includes('isVideoSource') &&
      value.isVideoSource
    )
      return true;
    else return false;
  }
  private makeVideoSource(
    option: string | null,
    value: string,
    isVideoSource: boolean,
  ): VideoSource {
    return { option, value, isVideoSource };
  }
  protected DFS(
    node: string | Map<VideoSource | string, Options | string> | symbol,
    ret: Array<string>,
  ) {
    if (node instanceof Map) {
      for (const [key, value] of node) {
        let videosource: VideoSource = this.makeVideoSource(null, '', false);
        if (!this.isVideoSource(key)) this.DFS(key, ret);
        else videosource = key;
        if (!this.isVideoSource(value)) this.DFS(value, ret);
        else videosource = value;
        //key value 둘다 비디오소스인 경우는 없음
        if (videosource !== undefined) {
          if (videosource.option) this.DFS(videosource.option, ret);
          this.DFS(videosource.value, ret);
        } //videosource 후순위
      }
    } else if (typeof node === 'symbol') {
    } else {
      if (node !== '') ret.push(node);
    }
  }
  build() {
    const a = Symbol();
    const b = Symbol();
    const c = Symbol();
    const d = Symbol();
    const graph = new Map();
    graph.set(a, this.globalOptions);
    graph.set(c, this.inSpec);
    graph.set(b, this.filterOptions);
    graph.set(d, this.outSpec);
    const args: string[] = [];
    if (this.defultYesFlag) args.push('-y');
    this.DFS(graph, args);
    this.argRef = args;
    console.log(`spawn: ffmpeg ${args.join(' ')}`);
    return spawn('ffmpeg', args);
  }
  applyStrategy(
    strategy: EncodingProcessBuilderStrategy<this>,
    context: EncodingContext,
  ): this {
    strategy(this, context);
    return this;
  }
}

export abstract class Factory<TBuilder> {
  abstract create(): TBuilder;
}

@Injectable()
export class FFMPEGBuilderFactory extends Factory<FFMPEGProcessBuilder> {
  create(): FFMPEGProcessBuilder {
    return new FFMPEGProcessBuilder();
  }
}
