const play = require('./lib/play.js').Play();
const {
    fork
} = require('child_process');
const fs = require('fs');
const obj = JSON.parse(fs.readFileSync('converted.json', 'utf8'));
var child = null;
const frameTime = 1000 / obj[0];

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
            play.sound('audio.mp3');
            break;
        case "timing":
            setTimeout(displayPulse, frameTime - (msg.data - frameTime));
    }
}

function handleError(e) {
    throw e;
}

child = new fork('./child.js');
child.on('message', handleMessage);
child.on('error', handleError);
child.on('exit', process.exit);