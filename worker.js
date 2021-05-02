const {
    workerData,
    parentPort
} = require('worker_threads');
const ntClient = require('wpilib-nt-client');
const client = new ntClient.Client();
var getPixels = require("get-pixels");
const tmp_out = workerData;
var height;
var width;

async function main() {
    //while (true) {
    try {
        var j = 0;
        var output = await new Promise(function (resolve, reject) {
            getPixels(tmp_out, (err, pixels) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(pixels);
                }
            });
        });
        while (j < height) {
            var k = 0;
            while (k < width) {
                var key_target = "/display/row" + String(j) + "/column" + String(k);
                if (Number(output.get(k, j, 0)) > 127) {
                    client.Assign(true, key_target);
                } else {
                    client.Assign(false, key_target);
                }
                k++;
            }
            j++;
        }
    } catch (e) {
        if (String(e) != "Error: Unexpected end of input") {
            console.error(e);
        }
    }
    //}
}

function messageHandler() {
    try {
        getPixels(tmp_out, function (err, pixels) {

            width = pixels.shape.slice()[0];
            height = pixels.shape.slice()[1];
            setInterval(function () {
                const loop = main();
                loop.catch((e) => {
                    if (String(e) != "Error: Unexpected end of input") {
                        console.error(e);
                    }
                });
            }, 5);


        });
    } catch (e) {
        if (String(e) != "Error: Unexpected end of input") {
            console.error(e);
        }
    }

}

parentPort.on('message', messageHandler);

client.start((isConnected, err) => {
    parentPort.postMessage(null);
}, '127.0.0.1');