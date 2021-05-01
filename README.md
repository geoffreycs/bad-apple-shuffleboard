# Bad Apple but it's played on FRC's WPILib Shuffleboard
Version 2 demo: https://youtu.be/KpqA7TDJLUQ  
Version 1 demo: https://youtu.be/po4Deg7V8vA
## Playback
I used a local NetworkTables server (`server.py`) running on `127.0.0.1` to minimize lag, but I guess you could use a real roboRIO if you wanted to for some reason. The playback script connects to the server, starts playing `audio.mp3` using `mpv`, and then begins to play the frame sequence. The "video" is stored in `converted.json`, which is formated so that once parsed, any given pixel can be accessed using `parsed[1][frame][row][column]` and the frame rate can be accessed as `[parsed][0]`. Each pixel is itself just a `1` or `0`, representing white and black, respectively.  

In order to actually play it, though, the script runs a function every several milliseconds (the exact timing is determined by the framerate stored in the JSON file) that goes to the current frame (starting with zero), iterating through each sub-array (row), where it iterates through each sub-sub-array (column), pushing `true` or `false` to a corresponding NetworkTables key. After it has completely scanned through a frame, it increments the frame counter and pushes that to NetworkTables as `/display/frame`.  

You'll notice that there are actually four scripts relating to playback in the repository. This is because playback is split into two threads, with timing and JSON parsing being in the main thread (`player1.js` or `player2.js`) and boolean flipping occuring in the subsidiary thread (`render.js` or `child.js`). The first pair is implemented as a NodeJS worker, while the second pair is implemented using process forking and IPC. In testing, the worker-based player was marginally better at keeping timing. To launch playback, run either `player1.js` or `player2.js`.  

 The NetworkTables boolean keys used to display the image on Shuffleboard are named as such: `/display/row[row #]/column[column #]`, and are arranged in a 20x15 grid following the naming scheme. I would have gone for a higher resolution, but in order to even get the 20x15 grid, I had to set the tile size to 32 pixels, and Shuffleboard refuses to acknowledge tile size settings smaller than 32. That, and dragging each of the individual boolean keys out of the left sidebar one by one was more than enough. The Shuffleboard layout file is provided here as `video.json`. If you decide to load up the layout, you still have to manually right click on the tab, choose Preferences, and hide the titles of the entries.
## Video conversion
As described above, the video file read by the script is actually just a massive JSON file full of nested arrays. 

To get to that JSON file from the original 480x360 30fps video, it was run through several transformations. First, it was ran through `ffmpeg`'s `threshold` filter to make it all entirely black and white, with no graytones. Next, it was scaled down to 20x15. Then, it was run through the `threshold` filter again, before each frame at 20fps was extracted as a numbered PNG image. Lastly, the `generate.js` script loaded each image up, and read each pixel's value from the red channel (it's all white and black so the color channel used didn't matter), storing into an array alongside the specified framerate.

Once every image had been read and parsed, the now-very-large array was formatted as JSON and written out as `converted.json`. The `generate.js` script accepts the frame rate as a command line argument. If none is specified, it defaults to 25fps. 
## Version 2 versus Version 1
* Increase demo resolution from 14x10 to 20x15
* `generate.js` gets the resolution from the PNGs rather than having it hardcoded
* `generate.js` reads framerate from command line paramters
* `converted.json` contains the framerate at the start of the file
* Playback timing and boolean toggling split into separate threads
* `player1.js` and `player2.js` calculate timings using framerate in `converted.json` instead of having it hardcoded at 50 milliseconds
* `mplayer` swapped out in favor of `mpv`
## Dependencies
Aside from Shuffleboard, the demo uses a few external dependencies:
* [`wpilib-nt-client`](https://www.npmjs.com/package/wpilib-nt-client), used by the player to talk to NetworkTables
* [`get-pixels`](https://www.npmjs.com/package/get-pixels), used by the generator script to read the PNG frames
* [`command-line-args`](https://www.npmjs.com/package/command-line-args), used by the generator script to allow the user to specify framerate
* [`pynetworktables`](https://robotpy.readthedocs.io/projects/pynetworktables/en/stable/), used by `server.py`
  * `server.py` is actually [just ripped straight from the example docs](https://robotpy.readthedocs.io/projects/pynetworktables/en/stable/examples.html#robot-example)
* [`play.js`](https://github.com/Marak/play.js/blob/master/README.md), included under the `lib` folder for playing the audio alongside the video
* `mpv` for actually playing the audio
## Why?
Because as far as I can tell, nobody has done this one before.
## That doesn't really answer the question
idk stfu
