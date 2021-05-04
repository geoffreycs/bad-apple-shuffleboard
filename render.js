const {
    workerData,
    parentPort
} = require('worker_threads');
const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
const now = require('performance-now');
var frame = 0;
var previousTime = 0;
var firstLoop = true;
const sampleFrames = 60;

function updateDisplay() {
    let newTime = now();
    let timeDiff = 0;
    if (!firstLoop) {
        timeDiff = newTime - previousTime;
    } else {
        firstLoop = false;
    }
    parentPort.postMessage(timeDiff);
    try {
        switch (frame) {
            case 3:
                console.time(String(sampleFrames) + ' frames');
                break;
            case (sampleFrames + 3):
                console.timeEnd(String(sampleFrames) + ' frames');
                break;
        }
        workerData[frame].forEach((scanline, row) => {
            scanline.forEach((pixel, column) => {
                var key_target = "/display/row" + String(row) + "/column" + String(column);
                if (pixel == 1) {
                    client.Assign(true, key_target);
                } else {
                    client.Assign(false, key_target);
                }
            });
        });
        client.Assign(frame, "/display/frame");
        frame++;
    } catch (e) {
        client.stop();
        client.destroy();
        parentPort.postMessage("done");
        process.exit();
    }
    previousTime = newTime;
}

client.start((isConnected, err) => {
    if (err) {
        throw err;
    } else {
        parentPort.on('message', updateDisplay);
        parentPort.postMessage("ready");
    }
}, '127.0.0.1');