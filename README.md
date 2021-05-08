# Bad Apple but it's played on FRC's WPILib Shuffleboard
Demo for 2.3.1 coming soon.
Version 2.0.0 demo: https://youtu.be/KpqA7TDJLUQ  
Version 1.0.0 demo: https://youtu.be/po4Deg7V8vA

## Requirements

* NetworkTables server of some sort
  * Included `server.py`:
    * Python 3
    * `pynetworktables` Python package
* FRC WPIlib Shuffleboard connected to server
  * Java runtime capable of executing JAR files
    * GraalVM recomended for performance when playing back at 28x21 resolution
* `player1.js`, `player2.js`, and `player_rf.js`:
  * `mpv` (or `mplayer`, see command-line usage)
  * Converted video file in JSON format
  * Corresponding audio file (optional)
* `generate.js`:
  * Frame sequence in PNG format
    * Images must be in a dedicated folder
    * Images must be named numerically with at least three integer digits (e.g. `004.png`, `625.png`, `2768.png`)
* `stream.js`:
  * `ffmpeg` and `ffplay`
  * Appropriately encoded input video with audio track
    * Audio track NOT optional
    * Ideal encoding from testing is raw RGB24 for video track and PCM_U8 for audio in an MOV container
  * Writable ramdisk
  * A decent CPU (especially at 28x21 instead of 20x15)
* `player1.js` and `stream.js`: NodeJS 11.7.0+ (or 10.5.0+ with `--experimental-worker` command-line flag)

## Command-line usage

### `player1.js`/`player2.js`/`player_rf.js`

```node {player1.js/player2.js/player_rf.js} [--input (-i) /path/to/file.JSON] [--audio (-a) /path/to/file.mp3 or "none"] [--server (-s) networktables.server] [--debug (-d)] [--mpv /path/to/mpv/or/mplayer/binary] [--delay 500]```

* `--input`/`-i`: Path to converted video JSON file. Defaults to `converted.json`.
* `--audio`/`-a`: Path to audio file, or "none" to disable audio playback. Defaults to `audio.mp3`.
* `--server`/`-s`: Hostname or IP address of NetworkTables server. Defaults to `127.0.0.1`.
* `--debug`/`-d`: Print frame times and time correction amounts every frame
* `--mpv`: Path to `mpv` or `mplayer` executable. Defaults to `mpv` in PATH.
* `--delay`: Milliseconds to delay video playback relative to audio playback. Defaults to `0`.

### `generate.js`

```node generate.js [--fps (-r) fps] [--folder (-i) path/to/folder/with/frames] [--output (-o) /path/to/output.json] [--ffmpeg /path/to/ffmpeg/binary] [--ffplay /path/to/ffplay/binary]```

* `--fps`/`-r`: Frames per second of intended video output. Defaults to 25.
* `--folder`/`-i`: Path to folder containing PNG frameset. Defaults to `frames`.
* `--output`/`-o`: Path of JSON to output to. Defaults to `converted.json`.
* `--ffmpeg`: Path to FFmpeg executable. Defaults to `ffmpeg` in PATH.
* `--ffplay`: Path to FFplay executable. Defaults to `ffplay` in PATH.

### `stream.js`

```node stream.js [--input (-i) /path/to/video.mov] [--tmp_dir (-t) /path/to/ramdisk] [--server (-s) networktables.server]```

* `--input`/`-i`: Path to video file. Defaults to `./bad_apple_raw.mov`, which is probably not useful for you.
* `--tmp_dir`/`-t`: Path to writable ramdisk. Defaults to `/media/geoffrey/ramdisk`, which is definitely useless for you.
* `--server`/`-s`: Hostname or IP address of NetworkTables server. Defaults to `127.0.0.1`.

## Playback (Version 2.x.x)
The playback script connects to the server, starts playing the audio file using `mpv` (unless `--audio none` is passed), and then begins to play the frame sequence. The "video" is stored in a JSON file, which is formated so that once parsed, any given pixel can be accessed using `parsed[1][frame][row][column]` and the frame rate can be accessed as `[parsed][0]`. Each pixel is itself just a `1` or `0`, representing white and black, respectively.  

In order to actually play it, though, the script runs a function every several milliseconds (the exact timing is determined by the framerate stored in the JSON file) that goes to the current frame (starting with zero), iterating through each sub-array (row), where it iterates through each sub-sub-array (column), pushing `true` or `false` to a corresponding NetworkTables key for `1` (white) or `0` (black), respectively. After it has completely scanned through a frame, it increments the frame counter and pushes the frame number to NetworkTables as `/display/frame`.  

You'll notice that there are actually five scripts relating to JSON playback in the repository. This is because playback is split into two threads starting with Version 2.0.0, with timing and JSON parsing being in the main thread (`player1.js` or `player2.js`) and boolean flipping occuring in the subsidiary thread (`render.js` or `child.js`). The first pair is implemented as a NodeJS worker thread, while the second pair is implemented using process forking and IPC. In testing, the worker-based player has marginally lower timing fluctuations. A third playback script, introduced in Version 2.3.1, `player_rf.js`, has both timing and boolean flipping in the same script (and therefore on the same event loop). The `rf` stands for **r**etro**f**it, alluding to the fact that its architecture is the same as the original Version 1 playback script, but retrofitted with the new timing correction system. To launch playback, run `player1.js`, `player2.js`, or `player_rf.js`. 

## Display using Shuffleboard
The NetworkTables boolean keys used to display the image on Shuffleboard are named as such: `/display/row[row #]/column[column #]`. On Shuffleboard, the boolean indicators are arranged in a 28x21 grid following the naming scheme. I would have gone for a higher resolution, but in order to even get the 28x21 grid, I had to set the tile size to 32 pixels with zero spacing, and Shuffleboard refuses to acknowledge tile size settings smaller than 32. That, and dragging each of the individual boolean keys out of the left sidebar one by one was more than enough. The Shuffleboard layout file is provided here as `video.json`. If you decide to load up the layout, you still have to manually right click on the tab, choose Preferences, and hide the titles of the entries on each startup/layout reload. The standard HotSpot Java VM is sufficient to run Shuffleboard at 20x15 resolution, but at 28x21, it begins to lag and drop frames. Running Shuffleboard using GraalVM CE solved the issue, although using Azul Zulu probably would have worked as well.

## Timing correction (Version 2.3+)
Versions prior to 2.3.0 were plauged with the issue that no matter the nominal framerate, the time between display updates would always be a bit too long, resulting in audio and video increasingly becoming unsynchronized over time. Version 2.1.0 changed the way display updates were timed. Rather than computing a fixed interval determined by frame rate, the secondary scripts (`render.js` and `child.js`) now measure the actual time between frames, sending this information to the primary script each frame. The primary script then takes this into account when scheduling the next update interval. Starting with Version 2.3.0, this correction is continuously applied and adjusted, meaning that the mean frame time is equal to the nominal time between frames.

## Video conversion (All versions)
Since the Shuffleboard layout is 28x21 and can only display two colors, a few conversion steps are needed.

First, the original Bad Apple video is ran through `ffmpeg`'s `threshold` filter to make it all entirely black and white, with no graytones. Next, it is scaled down to 28x21. Then, is ran through the `threshold` filter again. The final step or two depends on whether `stream.js` or `player1.js`/`player2.js` is to be used.

For the former, the file is reencoded as a raw RGB24 MOV file with raw PCM U8 audio. 

For the latter, each frame at 20fps is extracted as a numbered PNG image into `./frames`, and the `generate.js` script is used, which loads each image up, and reads each pixel's value from the red channel (it's all white and black so the color channel used didn't matter), storing into an array alongside the specified framerate. Once every image had been read and parsed, the large resulting array is formatted as JSON and written out as `converted.json`.

## Streaming (Version 2.x NA, deprecated)
(NA = New Architecture)

The streaming script, `stream.js`, and its sidekick, `worker.js`, do not require a special JSON video format like Version 2.x.x, but instead piggyback off of FFmpeg, which is responsible for maintaining the correct playback rate. For best results, the input video should be an MOV file with raw RGB24 video and raw PCM U8 audio. The script also requires a writable ramdisk and a pretty good computer.

To play the video, `stream.js` first loads an FFmpeg instance that generates two outputs simultaenously: a continuously-updated PNG image on the ramdisk and a Matroska audio stream written to `stdout`. A single FFmpeg process handling both audio and video ensures that A/V synchronization is maintained. The `-re` flag is used to ensure that the read rate matches the intended playback rate, and the codec is set to `copy` for the audio output. The audio output from `stdout` is piped into an `ffplay` instance, and the worker script, `worker.js`, reads from the ramdisk PNG every 5 milliseconds, iterating through each pixel and flipping the corresponding boolean on NetworkTables. The streaming scripts are themselves resolution-agnostic, with `worker.js` sampling the resolution from the first frame upon the beginning of playback.

## Changelog

### Version 2.x.x versus Version 2.0.0

#### Version 2.3.1 (Final update)
* Demo increased to resolution of 28x21 at 30fps
  * 20x15 video file kept as `20x15.json`
* Re-introduction of single-threaded player script as `player_rf.js`
* Update version numbering to always be X.X.X
* Fold Version 3.0 NA into the 2.x.x family as 2.1 NA and deprecate 2.x NA series

#### Version 2.3.0 and 2.3 NA
* More command-line options added for `player1.js` and `player2.js`, and `stream.js`.
* Fully functional timing correction

#### Version 2.2.0 and 2.2 NA
* More command-line options added for `generate.js`
* Command-line options added for `player1.js`,  `player2.js`, and `stream.js`.

#### Version 2.1.0
* Inter-frame timing correction during playback on `player1.js` and `player2.js`
  * Higher framerates now practical thanks to no more timing drift

#### Version 2.1 NA (formerly 3.0 NA)
* Introduction of new FFmpeg-based `stream.js` 
  * Uses a raw RGB24+PCM_U8 MOV file as input instead of a JSON file
  * Use FFmpeg to control playback
  * Proper A/V synchronization (when computer is beefy enough)
  * Requires use of a ramdisk for best results

### Version 2.0.0 versus Version 1.0.0
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
* [`command-line-args`](https://www.npmjs.com/package/command-line-args), used by the scripts to allow the user to specify framerate, input, and output
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
