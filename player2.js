const play = require('./lib/play.js').Play();
const {
    fork
} = require('child_process');
const fs = require('fs');
const obj = JSON.parse(fs.readFileSync('converted.json', 'utf8'));
var child = null;
var interval = null;

function displayPulse() {
    child.send({
        name: "pulse",
        data: null
    });
}

function handleMessage(msg) {
    switch (msg) {
        case "launched":
            child.send({
                name: "data",
                data: obj[1]
            });
            break;
        case "received":
            play.usePlayer('mpv');
            play.on('play', () => {
                interval = setInterval(displayPulse, 1000 / obj[0]);
            });
            play.sound('audio.mp3');
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