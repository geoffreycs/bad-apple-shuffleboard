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
const now = require('performance-now');
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
const obj = JSON.parse(fs.readFileSync(options.input, 'utf8'));
var child = null;
const frameTime = 1000 / obj[0];
var timeCorrection = 0;
var lastInterval;

function handleMessage(msg) {
    let handleBegin = now();
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
                child.send({
                    name: "pulse",
                    data: null
                });
            });
            play.sound(options.audio);
            break;
        case "timing":
            if (msg > 0) {
                timeCorrection = -(msg - frameTime);
            }
            let intervalTime = frameTime + timeCorrection - (now() - handleBegin);
            setTimeout(() => {
                child.send({
                    name: "pulse",
                    data: null
                });
            }, lastInterval);
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