"use strict";
// Process SDP and RTP packets
// De-packetize RTP packets to re-create H264 NAL Units
// Write H264 NAL units to a .264 file
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const transform = __importStar(require("sdp-transform"));
const stream_1 = require("stream");
// .h264 file header
const H264_HEADER = Buffer.from([0x00, 0x00, 0x00, 0x01]);
class H264Transport extends stream_1.Readable {
    constructor(client, details) {
        super({ objectMode: true, highWaterMark: 30 });
        this.rtpPackets = [];
        this._headerWritten = false;
        this.AUqueue = new Queue();
        this.canPushMore = false;
        this.MAX_QUE_SIZE = 150;
        this.curPacketTimestamp = -1;
        this.nextPacketTimestamp = -1;
        this.prevPacketMarker = false;
        this.firstAUHead = undefined;
        this.stream = [];
        this.client = client;
        this.details = details;
        client.on('data', (channel, data, packet) => {
            if (channel == details.rtpChannel) {
                if (this._headerWritten) {
                    this.processRTPPacket(packet);
                }
            }
        });
        this.processConnectionDetails();
    }
    processConnectionDetails() {
        const details = this.details;
        // Extract SPS and PPS from the MediaSource part of the SDP
        const fmtp = details.mediaSource.fmtp[0];
        if (!fmtp) {
            return;
        }
        const fmtpConfig = transform.parseParams(fmtp.config);
        const splitSpropParameterSets = fmtpConfig['sprop-parameter-sets']
            .toString()
            .split(',');
        const sps_base64 = splitSpropParameterSets[0];
        const pps_base64 = splitSpropParameterSets[1];
        const sps = Buffer.from(sps_base64, 'base64');
        const pps = Buffer.from(pps_base64, 'base64');
        this.stream.push(H264_HEADER);
        this.stream.push(sps);
        this.stream.push(H264_HEADER);
        this.stream.push(pps);
        this._headerWritten = true;
        this.firstAUHead = (Buffer.concat([H264_HEADER, sps, H264_HEADER, pps]));
    }
    processRTPPacket(packet) {
        this.nextPacketTimestamp = packet.timestamp;
        // When Marker is set to 1 pass the group of packets to processRTPFrame()
        if (this.curPacketTimestamp !== this.nextPacketTimestamp) {
            if (this.prevPacketMarker) {
                this.processRTPFrame(this.rtpPackets);
            }
            else {
                console.log('H264Warning: Access unit is discarded since there are no marker on last RTP packet...');
            }
            this.curPacketTimestamp = this.nextPacketTimestamp;
            this.stream = [];
            this.rtpPackets = [];
        }
        this.prevPacketMarker = packet.marker === 1;
        // Accumatate RTP packets
        this.rtpPackets.push(packet.payload);
    }
    processRTPFrame(rtpPackets) {
        const nals = [];
        let partialNal = [];
        for (let i = 0; i < rtpPackets.length; i++) {
            const packet = rtpPackets[i];
            const nal_header_f_bit = (packet[0] >> 7) & 0x01;
            const nal_header_nri = (packet[0] >> 5) & 0x03;
            const nal_header_type = (packet[0] >> 0) & 0x1f;
            if (nal_header_type >= 1 && nal_header_type <= 23) {
                // Normal NAL. Not fragmented
                nals.push(packet);
            }
            else if (nal_header_type == 24) {
                // Aggregation type STAP-A. Multiple NAls in one RTP Packet
                let ptr = 1; // start after the nal_header_type which was '24'
                // if we have at least 2 more bytes (the 16 bit size) then consume more data
                while (ptr + 2 < packet.length - 1) {
                    const size = (packet[ptr] << 8) + (packet[ptr + 1] << 0);
                    ptr = ptr + 2;
                    nals.push(packet.slice(ptr, ptr + size));
                    ptr = ptr + size;
                }
            }
            else if (nal_header_type == 25) {
                // STAP-B
                // Not supported
            }
            else if (nal_header_type == 26) {
                // MTAP-16
                // Not supported
            }
            else if (nal_header_type == 27) {
                // MTAP-24
                // Not supported
            }
            else if (nal_header_type == 28) {
                // Frag FU-A
                // NAL is split over several RTP packets
                // Accumulate them in a tempoary buffer
                // Parse Fragmentation Unit Header
                const fu_header_s = (packet[1] >> 7) & 0x01; // start marker
                const fu_header_e = (packet[1] >> 6) & 0x01; // end marker
                const fu_header_type = (packet[1] >> 0) & 0x1f; // Original NAL unit header
                // Check Start and End flags
                if (fu_header_s == 1 && fu_header_e == 0) {
                    // Start of Fragment}
                    const reconstructed_nal_type = (nal_header_f_bit << 7) + (nal_header_nri << 5) + fu_header_type;
                    partialNal = [];
                    partialNal.push(reconstructed_nal_type);
                    // copy the rest of the RTP payload to the temp buffer
                    for (let x = 2; x < packet.length; x++)
                        partialNal.push(packet[x]);
                }
                if (fu_header_s == 0 && fu_header_e == 0) {
                    // Middle part of fragment}
                    for (let x = 2; x < packet.length; x++)
                        partialNal.push(packet[x]);
                }
                if (fu_header_s == 0 && fu_header_e == 1) {
                    // End of fragment}
                    for (let x = 2; x < packet.length; x++)
                        partialNal.push(packet[x]);
                    nals.push(Buffer.from(partialNal));
                }
            }
            else if (nal_header_type == 29) {
                // Frag FU-B
                // Not supported
            }
        }
        // Write out all the NALs
        for (let x = 0; x < nals.length; x++) {
            this.stream.push(H264_HEADER);
            this.stream.push(nals[x]);
        }
        const packetType = nals.some((nal) => (nal[0] & 0x1f) === 5)
            ? 'key'
            : 'delta';
        const clockRate = this.details.mediaSource.rtp[0].rate
            ? this.details.mediaSource.rtp[0].rate
            : 90000;
        const timestamp = this.curPacketTimestamp;
        const durationTicks = (this.nextPacketTimestamp - this.curPacketTimestamp) >>> 0;
        const AU = { data: Buffer.concat(this.stream), packetType, clockRate, timestamp, durationTicks };
        if (this.AUqueue.size() < this.MAX_QUE_SIZE) {
            if (!this.canPushMore) {
                this.AUqueue.push(AU);
                return;
            }
            this.canPushMore = this.push(AU);
            return;
        }
        this.AUqueue.deque();
        this.AUqueue.push(AU);
    }
    _read() {
        this.canPushMore = true;
        while (!this.AUqueue.isEmpty() && this.canPushMore) {
            this.canPushMore = this.push(this.AUqueue.deque());
        }
        if (this.AUqueue.isEmpty())
            this.AUqueue.reset();
    }
    ;
}
exports.default = H264Transport;
class Queue {
    constructor() {
        this.bottom = 0;
        this.q = [];
    }
    push(x) {
        this.q.push(x);
    }
    deque() {
        const temp = this.q[this.bottom];
        this.bottom++;
        return temp;
    }
    isEmpty() {
        return this.q.length === this.bottom;
    }
    reset() {
        this.bottom = 0;
        this.q = [];
    }
    size() {
        return this.q.length - this.bottom;
    }
}
//# sourceMappingURL=H264Transport.js.map