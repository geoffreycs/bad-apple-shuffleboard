const play = require('./lib/play.js').Play();
const {
    fork
} = require('child_process');
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
}];
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
const obj = JSON.parse(fs.readFileSync(options.input, 'utf8'));
var child = null;
const frameTime = 1000 / obj[0];
var timeCorrection = 0;

function handleMessage(msg) {
    switch (msg.name) {
        case "launched":
            child.send({
                name: "server",
                data: options.server
            });
            break;
        case "connected":
            child.send({
                name: "data",
                data: obj[1]
            });
            break;
        case "received":
            if (options.audio == "none") {
                child.send({
                    name: "pulse",
                    data: null
                });
            } else {
                play.usePlayer(options.mpv);
                play.on('play', () => {
                    child.send({
                        name: "pulse",
                        data: null
                    });
                });
                play.sound(options.audio);
            }
            break;
        case "timing":
            if (msg.data > 0) {
                timeCorrection = timeCorrection - (msg.data - frameTime);
            }
            let intervalTime = frameTime + timeCorrection;
            setTimeout(() => {
                child.send({
                    name: "pulse",
                    data: null
                });
            }, intervalTime);
            if (options.debug == true) {
                console.log("Measured: " + String(msg.data) + "\nCorrection: " + String(timeCorrection) + "\nNext: " + String(intervalTime) + "\n");
            }
            break;
    }
}

function handleError(e) {
    throw e;
}

child = new fork('./child.js');
child.on('message', handleMessage);
child.on('error', handleError);
child.on('exit', process.exit);