"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var inputFile = 'test.mp4';
var outputFile = 'test.mkv';
(0, child_process_1.exec)("ffmpeg -y -i ".concat(inputFile, " -c copy ").concat(outputFile), function (error, stdout, stderr) {
    if (error) {
        console.log("error: %s", error);
        return;
    }
    if (stderr) {
        console.log("log: %s", stderr);
    }
    console.log("encoding succeed: %s", stdout);
});
