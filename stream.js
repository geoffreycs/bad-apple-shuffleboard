const {
    Worker
} = require('worker_threads');
var width;
var height;
var alreadyLaunched = false;
const optionDefinitions = [{
    name: 'input',
    alias: 'i',
    type: String,
    defaultOption: true,
    defaultValue: "./bad_apple_raw.mov"
},
{
    name: 'tmp_dir',
    alias: 't',
    type: String,
    defaultValue: "/media/geoffrey/ramdisk"
}, {
    name: 'server',
    alias: 's',
    type: String,
    defaultValue: '127.0.0.1'
}, {
    name: `ffmpeg`,
    type: String,
    defaultValue: `ffmpeg`
}, {
    name: `ffplay`,
    type: String,
    defaultValue: `ffplay`
}
];
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);
const {
    spawn
} = require("child_process");
const tmp_out = options.tmp_dir + "/bad_apple.png";

function messageHandler() {
    const sound_player = spawn(options.ffplay, ['-i', '-', '-hide_banner', '-nodisp']);
    const ffmpeg = spawn(options.ffmpeg, ['-re', '-i', options.input, '-c:a', 'copy', '-vn', '-f', 'matroska', '-', '-update', '1', '-y', '-an', tmp_out, '-hide_banner']);
    //const ffmpeg_audio = spawn('ffmpeg', ['-re', '-i', options.input, '-c:a', 'copy', '-vn', '-f', 'matroska', '-', '-hide_banner']);
    ffmpeg.stdout.pipe(sound_player.stdin);
    ffmpeg.stderr.on('data', (e) => {
        if (e.toString().includes("frame=")) {
            if (alreadyLaunched == false) {
                workerProcess.postMessage(null);
                alreadyLaunched = true;
            }
        }
    });
    ffmpeg.on('close', process.exit);
    ffmpeg.on('error', (e) => {
        console.error(e);
        process.exit();
    });
}

let workerProcess = new Worker('./worker.js', {
    workerData: [tmp_out, options.server]
});
workerProcess.on('message', messageHandler);