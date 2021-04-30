# Bad Apple but it's played on FRC's WPILib Shuffleboard
## Mechanism
I used a local NetworkTables server (`server.py`) running on `127.0.0.1` to minimize lag, but I guess you could use a real roboRIO if you wanted to for some reason. The `player.js` script connects to the server, starts playing `audio.wav` using `mplayer`, and then begins to play the frame sequence. The "video" is stored in `converted.json`, which is formated so that once parsed, any given pixel can be accessed as such: `parsed[frame][row][column]`. Each pixel is itself just a `1` or `0`, representing white and black, respectively. In order to actually play it, though, the script runs a function every 50 milliseconds (since the video is 20 frames per second) that goes to the current frame (starting with zero), iterating through each sub-array (row), where it iterates through each sub-sub-array (column), pushing `true` or `false` to a corresponding NetworkTables key. After it has completely scanned through a frame, it increments the frame counter and pushes that to NetworkTables as `/display/frame`. The NetworkTables boolean keys used to display the image on Shuffleboard are named as such: `/display/row[row #]/column[column #]`, and are arranged in a 14x10 grid following the naming scheme. The titles of the boolean indicators are hidden as well. I would have gone for a higher resolution, but in order to even get the 14x10 grid, I had to set the tile size to 50 pixels, and Shuffleboard starts to act weird if you set the tile size low enough (say, 19). That, and dragging 140 individual boolean keys out of the left sidebar one by one was more than enough.
## Video conversion
As described above, the video file read by the script is actually just a massive JSON file full of nested arrays. To get to that JSON file from the original 480x360 30fps video, it was run through several transformations. First, it was ran through `ffmpeg`'s `threshold` filter to make it all entirely black and white, with no graytones. Next, it was scaled down to 14x10 at 20fps. Then, it was run through the `threshold` filter again, before finally each frame was extracted as a numbered PNG image. Lastly, the `generate.js` script loaded each image up, and read each pixel's value from the red channel (it's all white and black so the color channel used didn't matter), storing into an array. Once every image had been read and parsed, the now-very-large array was formatted as JSON and written out as `converted.json`.
## Dependencies
Aside from Shuffleboard, the demo uses a few external dependencies:
* [`wpilib-nt-client`](https://www.npmjs.com/package/wpilib-nt-client), used by the player to talk to NetworkTables
* [`get-pixels`](https://www.npmjs.com/package/get-pixels), used by the generator script to read the PNG frames
* [`pynetworktables`](https://robotpy.readthedocs.io/projects/pynetworktables/en/stable/), used by `server.py`
  * `server.py` is actually [just ripped straight from the example docs](https://robotpy.readthedocs.io/projects/pynetworktables/en/stable/examples.html#robot-example)
* [`play.js`](https://github.com/Marak/play.js/blob/master/README.md), included under the `lib` folder for playing the audio alongside the video
* `mplayer` for actually playing the audio
## Why?
Because as far as I can tell, nobody has done this one before.
## That doesn't really answer the question
idk stfu
