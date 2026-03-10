"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
//테스트
var now = new Date();
var response = {
    streams: ["rtsp://210.99.70.120:1935/live/cctv001.stream", "rtsp://210.99.70.120:1935/live/cctv002.stream", "rtsp://210.99.70.120:1935/live/cctv003.stream", "rtsp://210.99.70.120:1935/live/cctv004.stream"],
    time: {
        start: now.toISOString().replace(/[:.TZ]/g, "-"),
        end: now.toISOString().replace(/[:.TZ]/g, "-"),
    }
};
function record(response) {
    var streams = response.streams;
    var start = response.time.start;
    var end = response.time.end;
    var inputString = '';
    var outputString = '';
    streams.forEach(function (streamURL, i) {
        inputString += ("-rtsp_transport tcp -i ".concat(streamURL, " "));
        outputString += ("-map ".concat(i, " -c copy -t 20 video").concat(i).concat(start).concat(end, ".ts "));
    });
    (0, child_process_1.exec)("ffmpeg -y ".concat(inputString, " ").concat(outputString), function (error, stdout, stderr) {
        if (error) {
            console.log("error: %s", error);
            return;
        }
        if (stderr) {
            console.log("log: %s", stderr);
        }
        console.log("encoding succeed: %s", stdout);
    });
}
record(response);
