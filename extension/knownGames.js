// Feel free to send PR with other games settings. 
//
// Important notes:
// 1. `isGridGame: true` will automatically issue instruction `!grid map height width 0 0 1 1`
//      so make the cell size equal to 1 for grid games.
// 2. For games with different field sizes use 
//     `viewport: function (ctx, width, height) { ... }` 
//      instead of `viewport: createViewport(...)`
//      See CodeOfKutulu for example.
// 3. You can get GameName from browser console. 
//      If unknown, just create some adequate name (game is not detectable)

const knownGames = {

    // Seabed security
    FC2023: {
        viewport: createViewport(
            (width = 10000),
            (height = 10000),
            (leftMargin = 4600),
            (rightMargin = 4600),
            (topMargin = 300),
            (bottomMargin = 500)
        ),
        isGridGame: false,
    },

    SearchRace: {
        viewport: createViewport((width = 16000), (height = 9000)),
        isGridGame: false,
    },

    CodersStrikeBack: {
        viewport: createViewport((width = 16000), (height = 9000)),
        isGridGame: false,
    },

    // Not detectable
    CodeRoyal: {
        viewport: createViewport((width = 1920), (height = 1080)),
        isGridGame: false,
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
        isGridGame: false,
    },

    // Not detectable
    OceanOfCode: {
        viewport: createViewport(
            (width = 15),
            (height = 15),
            (leftMargin = 510/60),
            (rightMargin = 510/60),
            (topMargin = 90/60),
            (bottomMargin = 90/60),
        ),
        isGridGame: true,
    },

    TheGreatEscape: {
        viewport: createViewportFromScreenshot(
            (fieldLogicalWidth = 9),
            (fieldLogicalHeight = 9),
            (screenshotWidth = 1920),
            (fieldLeft = 522),
            (fieldTop = 166),
            (fieldRight = 1400),
        ),
        playerStepEveryFrame: true,
        isGridGame: true,
    },

    // Not detectable
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
        isGridGame: false,
    },

    // Crystal Rush
    UTG2019: {
        viewport: createViewportFromScreenshot(
            (fieldLogicalWidth = 30),
            (fieldLogicalHeight = 15),
            (screenshotWidth = 16000),
            (fieldLeft = 610),
            (fieldTop = 1240),
            (fieldRight = 15820)
        ),
        isGridGame: true,
    },

    SpaceShooter: {
        viewport: createViewportFromScreenshot(
            (fieldLogicalWidth = 1700),
            (screenshotWidth = 1920),
            (fieldLeft = 0),
            (fieldTop = 0),
            (fieldRight = 1700)
        ),
        isGridGame: false,
    },

    // Not detectable
    CodeOfKutulu: {
        viewport: function(ctx, width, height) {  // width and height are integers corresponding to the size of map in cells
            let block = 1026 / height;
            return createViewportFromScreenshot(
                (fieldLogicalWidth = +width),
                (fieldLogicalHeight = +height),
                (screenshotWidth = 16000),
                (fieldLeft = 16000 * (1 - block * width / 1824)),
                (fieldTop = 0),
                (fieldRight = 16000)
            );
        },
        isGridGame: true,
    },
};

function createViewport(
    width,
    height,
    leftMargin = 0,
    rightMargin = 0,
    topMargin = 0,
    bottomMargin = 0,
) {
    return {
        left: -leftMargin,
        top: -topMargin,
        right: width + rightMargin,
        bottom: height + bottomMargin,
        fieldWidth: width,
        fieldHeight: height,
    };
}

// 1. Take screenshot of the full screen visualizer.
// 2. Open it in some image editor.
// 3. Find the game field corners coordinates in the screenshot.
// 4. Decide the desired logical field width.
// 5. Put all these data into this function.
// Or use hold-CTRL key feature in visualizer (and use 16000 for screenshotWidth)
function createViewportFromScreenshot(
    fieldLogicalWidth,
    fieldLogicalHeight,
    screenshotWidth,
    fieldLeft,
    fieldTop,
    fieldRight,
) {
    let fieldXFraction = (fieldRight - fieldLeft) / screenshotWidth;
    let screenLogicalWidth = fieldLogicalWidth / fieldXFraction;
    let screenLogicalHeight = (screenLogicalWidth * 9) / 16;
    let scale = screenLogicalWidth / screenshotWidth;
    let logicalLeft = fieldLeft * scale;
    let logicalTop = fieldTop * scale;
    let logicalRight = screenLogicalWidth - logicalLeft;
    let logicalBottom = screenLogicalHeight - logicalTop;
    return {
        left: -logicalLeft,
        top: -logicalTop,
        right: logicalRight,
        bottom: logicalBottom,
        fieldWidth: fieldLogicalWidth,
        fieldHeight: fieldLogicalHeight,
    };
}
