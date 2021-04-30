var getPixels = require("get-pixels");
var fs = require('fs');
const { resolve } = require("path");
var storage = [];
var i = 0;

main().then(() => {
    fs.writeFileSync('converted.json', JSON.stringify(storage));
    console.log("COMPLETE");
    process.exit();
});

async function main() {
    while (i < 4384) {
        var row_array = [];
        var j = 0;
        var output = await new Promise(function (resolve, reject) {
            getPixels("frames/" + (i + 1).toLocaleString('en-US', { minimumIntegerDigits: 3, useGrouping: false }) + ".png", (err, pixels) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(pixels);
                }
            });
        });
        while (j < 10) {
            var k = 0;
            var column_array = [];
            while (k < 14) {
                if (Number(output.get(k, j, 0)) == 255) {
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
