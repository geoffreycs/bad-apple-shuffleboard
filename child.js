const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
var frame = 0;
var obj = null;

function handleMessage(msg) {
    switch (msg.name) {
        case "data":
            obj = msg.data;
            process.send("received");
            break;
        case "pulse":
            updateDisplay();
            break;
    }
}

function updateDisplay() {
    try {
        switch(frame) {
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
}

process.on('message', handleMessage);

client.start((isConnected, err) => {
    if (err) {
        throw err;
    } else {
        process.send("launched");
    }
}, '127.0.0.1');
