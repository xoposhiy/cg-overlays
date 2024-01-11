# CG Overlays Chrome Extension

# What is CG Overlays?
It adds overlays to the Codingame IDE to help you solve their programming challenges.

![screenshot](screenshot.png)

![screenshot2](screenshot2.png)


## How to use?

1. Your bot `print to stderr` special instructions.
2. Extension parses them and `draw` them over standard game visualizer.

Each instruction should be on a separate line and have the following format: 
```
@[instructionName] [instructionArgs]
```

The following instructions are supported:

#### Rectangles

- `@r [color] [left] [top] [right] [bottom]` draws a rectangle without fill.
- `@fr ...` draws filled rectangle.
- `@tr ...` draws a rectangle with semitransparent fill.

#### Circles

- `@c [color] [x] [y] [radius]` draws a circle without fill.
- `@fc ...` draws a filled circle.
- `@tc ...` draws a circle with semitransparent fill.

#### Line paths

- `@l [color] [x1] [y1] [x2] [y2] ...` draws a lines path.
- `@fl ...` draws a lines path and fill internals.
- `@tl ...` draws a lines path and fill internals with semitransparent.

#### Text
- `@txt [color] [left] [bottom] [fontSize] [text]` draws a text. Font size is for 800px width canvas, for other canvas sizes font will be rescaled.
- `@font [font-name]` sets font for @txt.

#### Other
- `@o [opacity]` sets global opacity (in range 0 .. 1.0) for overlay canvas.
- `@vp [left] [top] [right] [bottom]` sets the viewport. Specify logical coordinates for left-top and right-bottom corners of visualizer screen. You don't need it for [known games](extension/knownGames.js).

### Coordinates 

All coordinates are logical coordinates, as in the game rules.

### Colors

Color can be specified in CSS color format (but no spaces please!). Some examples:
`#FF0000`, `rgb(0,255,255)`, `rgba(0,0,0,0.5)`, `red`.

Wrong color format will not be reported, but will be ignored.

## Errors checking

Syntax errors will be reported on the BSOD :)

### Sample stderr output

```
@o 0.7
@fr red 0 0 1000 1000
@r #00FFFF 1000 0 2000 1000
@tr rgb(0,255,255) 2000 0 3000 1000
@l white 8000 5000 10000 5000 9000 4000 8000 5000
@fl green 3000 5000 5000 5000 4000 4000 3000 5000
@c red 8000 5000 1000
@fc rgba(255,255,0,0.3) 8000 5000 500
@tc blue 10000 1000 500
@tc blue 10500 1200 500
@font monospace
@txt pink 10000 2000 40 Hello world
```
Result:

![result](screenshot3.png)

## Constraints
It works on game replay page, and IDE page. Refresh page if it is not working.

Stderr is available for your own bots only. That's why no overlays for other players' bots.

Some games may not work properly because the wrong viewport. You can set it manually with `@vp` instruction. But would be better to make a pull-request with proper changes in [knownGames.js](https://github.com/xoposhiy/cg-overlays/blob/main/extension/knownGames.js).

## Turning off
Small checkbox in top-left corder of visualizer will disable overlays.

Also you can disable extension.

## How to install extension

### From Chrome Web Store

coming soon...

### From sources

1. Clone / Download this repo
2. Open `Manage extensions` in Chrome.
3. Turn on developer mode.
4. Click `Load Unpacked` and select `extension` directory from this repository.
Done!

Open Codingame IDE, add some instructions to stderr and test. Refresh the page if something is not working.

## Contribute

To convert in-game coordinates to physical, we need the conversion rules.
Please, make pull requests with these rules for other games to [extension/knownGames.js](extension/knownGames.js).

Also, you can contribute more instructions to draw graphical primitives in file [extension/drawer.js](extension/drawer.js).

## TODO

* On the last micro-frame of the frame show the next frame overlay to decrease confusion during debugging.
* Add instruction to draw trajectory of entities.  
* Add some other graphical primitives (arrows, triangles, flags, ...)
* Add popup support
* Handle resize window event

## Thanks for icon

[Overlay icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/overlay)