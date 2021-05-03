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

function updateDisplay() {
    let newTime = now();
    let timeDiff = 0;
    if (firstLoop == false) {
        timeDiff = newTime - previousTime;
    } else {
        firstLoop = false;
    }
    parentPort.postMessage(newTime - previousTime);

    try {
        switch (frame) {
            case 0:
                console.time('60 frames');
                break;
            case 60:
                console.timeEnd('60 frames');
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

function pulseListener(msg) {
    if (msg == "pulse") {
        updateDisplay();
    }
}

client.start((isConnected, err) => {
    if (err) {
        throw err;
    } else {
        parentPort.on('message', pulseListener);
        parentPort.postMessage("ready");
    }
}, '127.0.0.1');