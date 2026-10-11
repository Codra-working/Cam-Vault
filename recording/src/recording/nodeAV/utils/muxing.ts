import { Packet } from 'node-av';
import { AccessUnit } from './AcessUnit';

export default function AU2Packet(au:AccessUnit, relativeTimestamp:bigint, streamIndex:number):Packet {
  const packet = new Packet();
  packet.alloc();
  packet.data = au.data;
  packet.pts = relativeTimestamp;
  packet.dts = relativeTimestamp;
  packet.duration = au.durationTicks;
  packet.isKeyframe = au.packetType === 'key';
  packet.timeBase = { num: 1, den: 90000 };
  packet.streamIndex = streamIndex;
  packet.pos = -1n;
  return packet;
}
