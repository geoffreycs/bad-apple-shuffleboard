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
}];
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
const obj = JSON.parse(fs.readFileSync(options.input, 'utf8'));
const frameTime = 1000 / obj[0];
var timeCorrection = 0;

function handleMessage(msg) {
    //let handleBegin = now();
    if (msg == "ready") {
        play.usePlayer('mpv');
        play.on('play', () => {
            //setTimeout(displayPulse, 1500);
            worker.postMessage(null);
        });
        play.sound(options.audio);
    } else {
        if (msg > 0) {
            timeCorrection = -(msg - frameTime);
        }
        let intervalTime = frameTime + timeCorrection;
        setTimeout(() => { worker.postMessage(null); }, intervalTime);
    }
}

let worker = new Worker('./render.js', {
    workerData: obj[1]
});
worker.on('message', handleMessage);
worker.on('error', console.error);
worker.on('exit', process.exit);