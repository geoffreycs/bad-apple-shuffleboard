const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
const now = require('performance-now');
var frame = 0;
var obj = null;
var previousTime = 0;
var firstLoop = true;

function handleMessage(msg) {
    switch (msg.name) {
        case "data":
            obj = msg.data;
            process.send({
                name: "received"
            });
            break;
        case "pulse":
            updateDisplay();
            break;
    }
}

function updateDisplay() {
    let newTime = now();
    let timeDiff = 0;
    if (firstLoop == false) {
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
                console.time('60 frames');
                break;
            case 63:
                console.timeEnd('60 frames');
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