const play = require('./lib/play.js').Play();
const {
    Worker
} = require('worker_threads');
const fs = require('fs');
const obj = JSON.parse(fs.readFileSync('converted.json', 'utf8'));
const frameTime = 1000 / obj[0];

function displayPulse() {
    worker.postMessage("pulse");
}

function handleMessage(msg) {
    if (msg == "ready") {
        play.usePlayer('mpv');
        play.on('play', () => {
            //setTimeout(displayPulse, 1500);
            displayPulse();
        });
        play.sound('audio.mp3');
    } else {
        //interval._repeat = 1000/obj[0] - msg;
        setTimeout(displayPulse, frameTime - (msg - frameTime));
    }
}

let worker = new Worker('./render.js', {
    workerData: obj[1]
});
worker.on('message', handleMessage);
worker.on('error', console.error);
worker.on('exit', process.exit);