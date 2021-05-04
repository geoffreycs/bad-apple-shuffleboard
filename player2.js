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
}];
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
const obj = JSON.parse(fs.readFileSync(options.input, 'utf8'));
var child = null;
const frameTime = 1000 / obj[0];
let lastInterval = frameTime;

function displayPulse() {
    child.send({
        name: "pulse",
        data: null
    });
}

function handleMessage(msg) {
    switch (msg.name) {
        case "launched":
            child.send({
                name: "data",
                data: obj[1]
            });
            break;
        case "received":
            play.usePlayer('mpv');
            play.on('play', () => {
                displayPulse();
            });
            play.sound(options.audio);
            break;
        case "timing":
            let intervalTime = frameTime;
            if (msg.data > 0) {
                intervalTime = frameTime - 1.00005*(msg.data - frameTime);
            }
            setTimeout(displayPulse, lastInterval);
            lastInterval = intervalTime;
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