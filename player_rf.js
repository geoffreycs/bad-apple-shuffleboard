const play = require('./lib/play.js').Play();
const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
const now = require('performance-now');
const sampleFrames = 60;
const fs = require('fs');
const optionDefinitions = [{
    name: 'input',
    alias: 'i',
    type: String,
    defaultValue: 'converted.json'
}, {
    name: 'audio',
    alias: 'a',
    type: String,
    defaultValue: 'audio.mp3'
}, {
    name: 'debug',
    alias: 'd',
    type: Boolean,
    defaultValue: 'false'
}, {
    name: 'server',
    alias: 's',
    type: String,
    defaultValue: '127.0.0.1'
}, {
    name: 'mpv',
    type: String,
    defaultValue: 'mpv'
}, {
    name: 'delay',
    type: Number,
    defaultValue: 0
}];
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
const obj = JSON.parse(fs.readFileSync(options.input, 'utf8'));
const frameTime = 1000 / obj[0];
var timeCorrection = 0;
var frame = 0;
var previousTime = 0;
var firstLoop = true;

function updateDisplay() {
    let newTime = now();
    let timeDiff = 0;
    if (!firstLoop) {
        timeDiff = newTime - previousTime;
        timeCorrection = timeCorrection - (timeDiff - frameTime);
    } else {
        firstLoop = false;
    }
    let intervalTime = frameTime + timeCorrection;
    setTimeout(updateDisplay, intervalTime);
    if (options.debug == true) {
        console.log("Measured: " + String(timeDiff) + "\nCorrection: " + String(timeCorrection) + "\nNext: " + String(intervalTime) + "\n");
    }
    try {
        switch (frame) {
            case 3:
                console.time(String(sampleFrames) + ' frames');
                break;
            case (sampleFrames + 3):
                console.timeEnd(String(sampleFrames) + ' frames');
                break;
        }
        obj[1][frame].forEach((scanline, row) => {
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
        process.exit();
    }
    previousTime = newTime;
}

client.start((isConnected, err) => {
    if (err) {
        throw err;
    } else {
        if (options.audio == "none") {
            updateDisplay();
        } else {
            play.usePlayer(options.mpv);
            play.on('play', () => {
                setTimeout(updateDisplay, options.delay);
            });
            play.sound(options.audio);
        }
    }
}, options.server);