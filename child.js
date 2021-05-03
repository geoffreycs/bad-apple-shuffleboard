const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
const now = require('performance-now');
var frame = 0;
var obj = null;
var previousTime = 0;

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
    process.send({
        name: "timing",
        data: newTime - previousTime
    });
    try {
        switch (frame) {
            case 0:
                console.time('60 frames');
                break;
            case 60:
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