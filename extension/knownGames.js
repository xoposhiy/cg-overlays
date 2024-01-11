// Feel free to send PR with other games settings.
// Format: @vp left top right bottom
// (width, height) - logical (in-game) size of the game field. Take it from the game statements.
// (xxxMargin) - margin size in logical (in-game) units. 
// You should get them from Referee view code, or find out experimentally.
// BTW visualizer screen is always 16:9 (same as 1920 x 1080)
const viewports = {
    "FC2023" : createViewport(
        width = 10000, 
        height = 10000, 
        leftMargin = 4600, 
        rightMargin = 4600, 
        topMargin = 300, 
        bottomMargin = 500
    ),
    
    "Search Race": createViewport(width=16000, height=9000),
    
    "CodersStrikeBack": createViewport(width = 16000, height = 9000),
     
    // Code Royal ¯\_(ツ)_/¯
    "CodinGame": createViewport(width = 1920, height = 1080),
    
    "CodeBusters": createViewport(
        width = 16000, 
        height = 9000, 
        leftMargin = 350, 
        rightMargin = 350, 
        topMargin = 220, 
        bottomMargin = 100
    ),
};

function createViewport(width, height, leftMargin = 0, rightMargin = 0, topMargin = 0, bottomMargin = 0) {
    return `@vp ${-leftMargin} ${-topMargin} ${width + rightMargin} ${height + bottomMargin}`;
}

const defaultViewport = "@vp 0 0 16000 9000";