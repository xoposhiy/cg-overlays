# CG Overlays Chrome Extension

You bot should output to stderr special instructions, which will be interpreted by the extension,
and the overlay will be added to the game visualizer.

## Screenshots

![screenshot](screenshot.png)

![screenshot2](screenshot2.png)

## Example of stderr

This output:
```
@r 0 7721 4529 8508 red
@fr 5120 7721 9999 8508 rgba(0,255,0,0.5)
@tc 4885 9920 200 #0000FF
```

Will draw:
1. red rectangle
2. green semirtansparent filled rectangle
3. blue circle with contour and semitransparent fill.

Coordinates are in-game logical coordinates.

## Contribute

To convert in-game coordinates to physical, we need the conversion rules.
Contribute this rules to `[extension/knownGames.js](extension/knownGames.js)`.

## TODO

[ ] Handle resize event
[ ] Add instruction to draw trajectory of entities.  
[ ] On the last micro-frame of the frame show the next frame overlay to decrease confusion during debugging.

## Icons

[Overlay icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/overlay)
