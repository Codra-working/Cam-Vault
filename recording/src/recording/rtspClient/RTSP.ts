import { H264Transport, RTSPClient, type Details } from 'yellowstone';
import { Injectable } from '@nestjs/common';
import { pipeline } from 'node:stream';

@Injectable()
export default class RTSPClientManager {
  client!: RTSPClient;

  detailsArray: Details[] = [];

  h264Transport!: H264Transport;

  baseTimeStamp: number;

  async connect(url: string, username = '', password = '') {
    // Will automatically exit if the Argument (the RTSL URL) is missing
    const transport = 'tcp';

    // Step 1: Create an RTSPClient instance
    console.log(`Connecting to ${url}`);
    this.client = new RTSPClient(username, password);
    this.detailsArray = await this.client.connect(url, {
      connection: transport,
      secure: username !== '' && password !== '',
    });
    console.log('Connected');

    if (this.detailsArray.length === 0) {
      throw new Error(
        'ERROR: There are no compatible RTP payloads to save to disk',
      );
    }
    for (let i = 0; i < this.detailsArray.length; i++) {
      const details = this.detailsArray[i];
      console.log(`Stream ${i.toString()}. Codec is`, details.codec);
      // Step 3: Open the output file
      if (details.codec === 'H264') {
        // Step 4: Create H264Transport passing in the client, file, and details
        // This class subscribes to the client 'data' event, looking for the video payload
        this.client.h264Transport = new H264Transport(this.client, details);
      } else throw new Error('Error: not supported codec');
    }
  }

  async play() {
    // Step 5: Start streaming!
    await this.client.play();
    console.log('Play sent');
  }
}
