"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_stream_1 = require("node:stream");
const RTSPClient_1 = __importDefault(require("./RTSPClient"));
const CircularQueue_1 = __importDefault(require("./CircularQueue"));
class RTSPClientAdapter extends node_stream_1.Readable {
    constructor(username, password, options) {
        options.objectMode = true;
        super(options);
        this.rtspClient = new RTSPClient_1.default(username, password);
        this.queue = new CircularQueue_1.default(1024);
        this.rtspClient.on('data', (channel, data, packet) => {
            this.channel = channel;
            this.queue.enqueue(packet);
        });
    }
}
exports.default = RTSPClientAdapter;
//# sourceMappingURL=RTSPClientAdapter.js.map