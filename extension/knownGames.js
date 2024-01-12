// Feel free to send PR with other games settings.
// Format: @vp left top right bottom
// (width, height) - logical (in-game) size of the game field. Take it from the game statements.
// (xxxMargin) - margin size in logical (in-game) units.
// You should get them from Referee view code, or find out experimentally.
// BTW visualizer screen is always 16:9 (same as 1920 x 1080)
const knownGames = {
  unknown: {
    viewport: createViewport((width = 16000), (height = 9000)),
    playerStepEveryFrame: false,
  },

  FC2023: {
    viewport: createViewport(
      (width = 10000),
      (height = 10000),
      (leftMargin = 4600),
      (rightMargin = 4600),
      (topMargin = 300),
      (bottomMargin = 500)
    ),
  },

  "Search Race": {
    viewport: createViewport((width = 16000), (height = 9000)),
  },

  CodersStrikeBack: {
    viewport: createViewport((width = 16000), (height = 9000)),
  },

  // Code Royal ¯\_(ツ)_/¯
  CodinGame: {
    viewport: createViewport((width = 1920), (height = 1080)),
  },

  CodeBusters: {
    viewport: createViewport(
      (width = 16000),
      (height = 9000),
      (leftMargin = 350),
      (rightMargin = 350),
      (topMargin = 220),
      (bottomMargin = 100)
    ),
  },

  OceanOfCode: {
    viewport: createViewport(
      (width = 900),
      (height = 900),
      (leftMargin = 510),
      (rightMargin = 510),
      (topMargin = 90),
      (bottomMargin = 90)
    ),
  },

  //@vp -535 -170 1433 937
  TheGreatEscape: {
    viewport: createViewportFromScreenshot(
      (fieldLogicalWidth = 900),
      (screenshotWidth = 1920),
      (fieldLeft = 522),
      (fieldRight = 1400),
      (fieldTop = 166)
    ),
    playerStepEveryFrame: true,
  },

  //@vp -300 -180 4300 1980
  GameOfDrones: {
    viewport: createViewport(
      (width = 4000),
      (height = 1800),
      (leftMargin = 300),
      (rightMargin = 300),
      (topMargin = 180),
      (bottomMargin = 180)
    ),
    playerStepEveryFrame: true,
  },
};

// Sometimes gameName is null, so we need to detect it from the game frame.
// Find several strings in the very first game frame in the view field, and put them here.
// If gameName is null and all strings are found, then gameName is set to the gameName of the first found item.
const detectStrings = [
  {
    gameName: "OceanOfCode",

    substrings: [
      '{"entitymodule":{"width":1920,"height":1080}}',
      "island",
      "Island",
      "Water",
    ],
  },
  {
    gameName: "GameOfDrones",

    substrings: ["\nGOD\n"],
  },
];

function createViewport(
  width,
  height,
  leftMargin = 0,
  rightMargin = 0,
  topMargin = 0,
  bottomMargin = 0
) {
  return `@vp ${-leftMargin} ${-topMargin} ${width + rightMargin} ${
    height + bottomMargin
  }`;
}

// 1. Take screenshot of the full screen visualizer.
// 2. Open it in some image editor.
// 3. Find the game field corners coordinates in the screenshot.
// 4. Decide the desired logical field width.
// 5. Put all these data into this function.
function createViewportFromScreenshot(
  fieldLogicalWidth,
  screenshotWidth,
  fieldLeft,
  fieldRight,
  fieldTop
) {
  let fieldXFraction = (fieldRight - fieldLeft) / screenshotWidth;
  let screenLogicalWidth = fieldLogicalWidth / fieldXFraction;
  let screenLogicalHeight = (screenLogicalWidth * 9) / 16;
  let scale = screenLogicalWidth / screenshotWidth;
  let logicalLeft = fieldLeft * scale;
  let logicalTop = fieldTop * scale;
  let logicalRight = screenLogicalWidth - logicalLeft;
  let logicalBottom = screenLogicalHeight - logicalTop;
  return `@vp ${-Math.round(logicalLeft)} ${-Math.round(
    logicalTop
  )} ${Math.round(logicalRight)} ${Math.round(logicalBottom)}`;
}
