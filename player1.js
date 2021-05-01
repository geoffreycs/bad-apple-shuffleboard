const play = require('./lib/play.js').Play();
const {
    Worker
} = require('worker_threads');
const fs = require('fs');
const obj = JSON.parse(fs.readFileSync('converted.json', 'utf8'));
var worker = null;
var interval = null;

function launchRenderer() {
    return new Promise((resolve, reject) => {
        worker = new Worker('./render.js', {
            workerData: obj[1]
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', process.exit);
    });
}

function displayPulse() {
    worker.postMessage("pulse");
}

function initPlayback(msg) {
    if (msg == "ready") {
        play.usePlayer('mpv');
        play.on('play', () => {
            interval = setInterval(displayPulse, 1000/obj[0]);
        });
        play.sound('audio.mp3');
    }
}

let renderProcess = launchRenderer();
renderProcess.catch(err => console.error(err));
renderProcess.then(initPlayback);