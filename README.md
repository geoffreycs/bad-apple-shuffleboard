# Bad Apple but it's played on FRC's WPILib Shuffleboard
No demo for Versions 2.1 and 3 because it doesn't look different from Version 2  
Version 2 demo: https://youtu.be/KpqA7TDJLUQ  
Version 1 demo: https://youtu.be/po4Deg7V8vA

## Streaming (Version 3 NA)
(NA = New Architecture)

I used a local NetworkTables server (`server.py`) running on `127.0.0.1` to minimize lag, but I guess you could use a real roboRIO if you wanted to for some reason. The streaming script, `stream.js`, and its sidekick, `worker.js`, do not require a special JSON video format, but instead piggyback off of FFmpeg, which is responsible for maintaining the correct playback rate. For best results, the input video should be an MOV file with raw RGB24 video and raw PCM U8 audio. The script also requires a writable ramdisk.

The syntax for launching the streaming script is:   
```node stream.js -i /path/to/video.mov -t /path/to/ramdisk```

To play the video, `stream.js` first loads an FFmpeg instance that generates two outputs simultaenously: a continuously-updated PNG image on the ramdisk and a Matroska audio stream written to `stdout`. A single FFmpeg process handling both audio and video ensures that A/V synchronization is maintained. The `-re` flag is used to ensure that the read rate matches the intended playback rate, and the codec is set to `copy` for the audio output. The audio output from `stdout` is piped into an `ffplay` instance, and the worker script, `worker.js`, reads from the ramdisk PNG every 5 milliseconds, iterating through each pixel and flipping the corresponding boolean on NetworkTables to `true` for values closer to white, and `false` for values closer to black. The streaming scripts are themselves resolution-agnostic, with `worker.js` sampling the resolution from the first frame upon the beginning of playback.

The NetworkTables boolean keys used to display the image on Shuffleboard are named as such: `/display/row[row #]/column[column #]`. On Shuffleboard, the boolean indicators are arranged in a 20x15 grid following the naming scheme. I would have gone for a higher resolution, but in order to even get the 20x15 grid, I had to set the tile size to 32 pixels, and Shuffleboard refuses to acknowledge tile size settings smaller than 32. That, and dragging each of the individual boolean keys out of the left sidebar one by one was more than enough. The Shuffleboard layout file is provided here as `video.json`. If you decide to load up the layout, you still have to manually right click on the tab, choose Preferences, and hide the titles of the entries.

## Playback (Version 2)
The playback script connects to the server, starts playing `audio.mp3` using `mpv`, and then begins to play the frame sequence. The "video" is stored in `converted.json`, which is formated so that once parsed, any given pixel can be accessed using `parsed[1][frame][row][column]` and the frame rate can be accessed as `[parsed][0]`. Each pixel is itself just a `1` or `0`, representing white and black, respectively.  

In order to actually play it, though, the script runs a function every several milliseconds (the exact timing is determined by the framerate stored in the JSON file) that goes to the current frame (starting with zero), iterating through each sub-array (row), where it iterates through each sub-sub-array (column), pushing `true` or `false` to a corresponding NetworkTables key. After it has completely scanned through a frame, it increments the frame counter and pushes that to NetworkTables as `/display/frame`.  

You'll notice that there are actually four scripts relating to JSON playback in the repository. This is because playback is split into two threads, with timing and JSON parsing being in the main thread (`player1.js` or `player2.js`) and boolean flipping occuring in the subsidiary thread (`render.js` or `child.js`). The first pair is implemented as a NodeJS worker, while the second pair is implemented using process forking and IPC. In testing, the worker-based player was marginally better at keeping timing. To launch playback, run either `player1.js` or `player2.js`.  

## Timing correction (Version 2.1)
Versions 1 and 2 were plauged with the issue that no matter the nominal framerate, the time between display updates would always be a bit too long, resulting in audio and video increasingly becoming unsynchronized over time. Version 2.1 changed the way display updates were timed. Rather than computing a fixed interval determined by frame rate, the secondary scripts (`render.js` and `child.js`) now measure the actual time between frames, sending this information to the primary script each frame. The primary script then takes this into account when scheduling the next update interval, ensuring that the average time between frames is actually what it's supposed to be.

## Video conversion (All versions)
Since the Shuffleboard layout is 20x15 and can only display two colors, a few conversion steps are needed.

First, the original Bad Apple video was ran through `ffmpeg`'s `threshold` filter to make it all entirely black and white, with no graytones. Next, it was scaled down to 20x15. Then, it was run through the `threshold` filter again. The final step or two depended on whether `stream.js` or `player1.js`/`player2.js` was to be used.

For the former, the file was reencoded as a raw RGB24 MOV file with raw PCM U8 audio. 

For the latter, each frame at 20fps was extracted as a numbered PNG image into `./frames`, and the `generate.js` script was used, which loaded each image up, and read each pixel's value from the red channel (it's all white and black so the color channel used didn't matter), storing into an array alongside the specified framerate. Once every image had been read and parsed, the large resulting array was formatted as JSON and written out as `converted.json`. The `generate.js` script accepts the frame rate as a command line argument. If none is specified, it defaults to 25fps. 

## Version 3 versus Version 2
* Uses a raw RGB24+PCM_U8 MOV file as input instead of a JSON file
* Use FFmpeg to control playback
* Proper A/V synchronization
* Requires use of a ramdisk for best results

## Version 2.1 versus Version 2
* Continuous timing correction during playback
* Higher framerates now practical thanks to no more timing drift

## Version 2 versus Version 1
* Increase demo resolution from 14x10 to 20x15
* `generate.js`:
  * Resolution is taken from the PNGs rather than having it hardcoded
  * Framerate can be specified with a command line parameter
  * Total number of frames to be converted is taken from directory listing instead of having it hardcoded
* `converted.json` contains the framerate at the start of the file
* Playback timing and boolean toggling split into separate threads
* `player1.js` and `player2.js` calculate timings using framerate in `converted.json` instead of having it hardcoded at 50 milliseconds
* `mplayer` swapped out in favor of `mpv`

## Dependencies
Aside from Shuffleboard, the demo uses a few external dependencies:
* [`wpilib-nt-client`](https://www.npmjs.com/package/wpilib-nt-client), used by the player to talk to NetworkTables
* [`get-pixels`](https://www.npmjs.com/package/get-pixels), used by the generator script to read the PNG frames
* [`command-line-args`](https://www.npmjs.com/package/command-line-args), used by the generator script to allow the user to specify framerate
* [`performance-now`](https://www.npmjs.com/package/performance-now), used by the player to calculate and correct for timing errors
* [`pynetworktables`](https://robotpy.readthedocs.io/projects/pynetworktables/en/stable/), used by `server.py`
  * `server.py` is actually [just ripped straight from the example docs](https://robotpy.readthedocs.io/projects/pynetworktables/en/stable/examples.html#robot-example)
* [`play.js`](https://github.com/Marak/play.js/blob/master/README.md), included under the `lib` folder for playing the audio alongside the video
* `mpv` for actually playing the audio
* FFmpeg and FFplay, which form the backbone of `stream.js`

## Why?
Because as far as I can tell, nobody has done this one before.
## That doesn't really answer the question
idk stfu
