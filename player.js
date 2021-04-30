const fs = require('fs');
const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
const obj = JSON.parse(fs.readFileSync('converted.json', 'utf8'));
const play = require('./lib/play.js').Play();
var frame = 0;

function updateDisplay() {
    try {
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
    }
    catch (e) {
        client.stop();
        client.destroy();
        process.exit();
    }
}

client.start((isConnected, err) => {
    play.usePlayer('mplayer');
    play.on('play', () => {
        setInterval(updateDisplay, 50);
    });
    play.sound('audio.mp3');
}, '127.0.0.1');
