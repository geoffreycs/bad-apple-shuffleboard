const play = require('./lib/play.js').Play();
const {
    Worker
} = require('worker_threads');
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
const frameTime = 1000 / obj[0];
var timeCorrection = 0;

function handleMessage(msg) {
    //let handleBegin = now();
    if (msg == "ready") {
        if (options.audio == "none") {
            worker.postMessage(null);
        } else {
            play.usePlayer(options.mpv);
            play.on('play', () => {
                worker.postMessage(null);
            });
            play.sound(options.audio);
        }
    } else {
        if (msg > 0) {
            timeCorrection = timeCorrection - (msg - frameTime);
        }
        let intervalTime = frameTime + timeCorrection;
        setTimeout(() => { worker.postMessage(null); }, intervalTime);
        if (options.debug == true) {
            console.log("Measured: " + String(msg) + "\nCorrection: " + String(timeCorrection) + "\nNext: " + String(intervalTime) + "\n");
        }
    }
}

let worker = new Worker('./render.js', {
    workerData: [obj[1], options.server]
});
worker.on('message', handleMessage);
worker.on('error', console.error);
worker.on('exit', process.exit);