var getPixels = require("get-pixels");
var fs = require('fs');
var storage = [];
var i = 0;
var width;
var height;
const optionDefinitions = [{
    name: 'fps',
    alias: 'r',
    type: Number,
    defaultOption: true,
    defaultValue: 25
}];
const commandLineArgs = require('command-line-args');
const options = commandLineArgs(optionDefinitions);


getPixels("frames/001.png", function (err, pixels) {
    if (err) {
        console.error(err);
    } else {
        width = pixels.shape.slice()[0];
        height = pixels.shape.slice()[1];
        fs.readdir('./frames', (err, files) => {
            main(files.length).then(() => {
                fs.writeFileSync('converted.json', JSON.stringify([options.fps, storage]));
                console.log("COMPLETE");
                process.exit();
            });
        });
    }
});

async function main(count) {
    while (i < count) {
        var row_array = [];
        var j = 0;
        var output = await new Promise(function (resolve, reject) {
            getPixels("frames/" + (i + 1).toLocaleString('en-US', {
                minimumIntegerDigits: 3,
                useGrouping: false
            }) + ".png", (err, pixels) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(pixels);
                }
            });
        });
        while (j < height) {
            var k = 0;
            var column_array = [];
            while (k < width) {
                if (Number(output.get(k, j, 0)) > 127) {
                    column_array.push(1);
                } else {
                    column_array.push(0);
                }
                k++;
            }
            row_array.push(column_array);
            j++;
        }
        storage.push(row_array);
        i++;
    }
}