const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
const now = require('performance-now');
var frame = 0;
var obj = null;
var previousTime = 0;
var firstLoop = true;
const sampleFrames = 60;

function handleMessage(msg) {
    let newTime = now();
    switch (msg.name) {
        case "data":
            obj = msg.data;
            process.send({
                name: "received"
            });
            break;
        case "pulse":
            updateDisplay(newTime);
            break;
    }
}

function updateDisplay(newTime) {
    let timeDiff = 0;
    if (!firstLoop) {
        timeDiff = newTime - previousTime;
    } else {
        firstLoop = false;
    }
    process.send({
        name: "timing",
        data: timeDiff
    });
    try {
        switch (frame) {
            case 3:
                console.time(String(sampleFrames) + ' frames');
                break;
            case (sampleFrames + 3):
                console.timeEnd(String(sampleFrames) + ' frames');
                break;
        }
        obj[frame].forEach((scanline, row) => {
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
        process.send("done");
        process.exit();
    }
    previousTime = newTime;
}

process.on('message', handleMessage);

client.start((isConnected, err) => {
    if (err) {
        throw err;
    } else {
        process.send({
            name: "launched"
        });
    }
}, '127.0.0.1');