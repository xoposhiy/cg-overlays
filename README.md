# CG Overlays Chrome Extension

You bot should output to stderr special instructions, which will be interpreted by the extension,
and the overlay will be added to the game visualizer.

## Screenshots

![screenshot](screenshot.png)

![screenshot2](screenshot2.png)

## Stderr output sample

```
@r 0 7721 4529 8508 red
@fr 5120 7721 9999 8508 rgba(0,255,0,0.5)
@tc 4885 9920 200 #0000FF
```

This stderr output will draw:
1. red rectangle
2. green semitransparent filled rectangle
3. blue circle with contour and semitransparent fill.

Click the extension icon to get [more details](extension/help.html)

## How to install extension

From Chrome Web Store (coming soon...)

From sources.

1. Clone/Download this repo
2. Open `Manage extensions` in Chrome.
3. Turn on developer mode.
4. Click `Load Unpacked` and select `extension` directory from this repository.
Done!

Open Codingame IDE, add some instructions to stderr and test.

## Contribute

To convert in-game coordinates to physical, we need the conversion rules.
Contribute this rules to [extension/knownGames.js](extension/knownGames.js).

## TODO

* Handle resize event
* Add instruction to draw trajectory of entities.  
* On the last micro-frame of the frame show the next frame overlay to decrease confusion during debugging.

## Icons

[Overlay icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/overlay)
