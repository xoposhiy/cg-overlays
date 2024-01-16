class Drawer {
    constructor(canvas, originalCanvas, gameName) {
        this.canvas = canvas;
        this.originalCanvas = originalCanvas;
        this.ctx = canvas.getContext('2d');
        this.contextAdapter = new ContextAdapter(this.ctx, 1.0, 0, 0);
        this.fontName = 'Arial';
        this.gameInfo = knownGames[gameName];
        this.gameName = gameName;
        this.grids = {};
        console.log("Detected GameName: " + gameName);
        console.log("GameInfo:", this.gameInfo);
        if (this.gameInfo){
            const viewport = this.gameInfo.viewport;
            if (typeof viewport == 'object'){
                this.setViewport(viewport);
                this.createDefaultGrid();
            }
        }
    }

    isViewportInitialized() {
        return this.gameInfo && typeof this.gameInfo.viewport == 'object';
    }

    resized(){
        this.canvas.style.top = this.originalCanvas.style.top;
        this.canvas.style.left = this.originalCanvas.style.left;
        this.canvas.style.width = this.originalCanvas.style.width;
        this.canvas.style.height = this.originalCanvas.style.height;
        this.canvas.width = this.originalCanvas.width;
        this.canvas.height = this.originalCanvas.height;
        let viewport = this.gameInfo.viewport;
        let k = this.canvas.width / (viewport.right - viewport.left);
        this.contextAdapter = new ContextAdapter(this.ctx, k, -viewport.left, -viewport.top)
    }

    game_types = 'name int? int?';
    game(gameName, width, height) {
        let knownGame = knownGames[gameName];
        this.gameInfo = knownGame;
        if (this.gameInfo) {
            let viewport;
            if (typeof knownGame.viewport == 'function') {
                if (width == undefined || height == undefined) 
                    throw new Error(`width and height arguments are required for this game`);
                viewport = knownGame.viewport(this, width, height);
            } else {
                viewport = knownGame.viewport;
            }
            this.setViewport(viewport);
            this.createDefaultGrid();
        } else {
            throw new Error(`Unknown game ${gameName}. Use !vp instruction to set viewport manually.`);
        }
        if (gameName != this.gameName){
            this.gameName = gameName;
            console.log(`GameName set to: ${gameName}`);
            console.log("GameInfo:", this.gameInfo);
        }
    }

    createDefaultGrid() {
        const viewport = this.gameInfo.viewport;
        if (this.gameInfo.isGridGame && viewport && typeof viewport == 'object') {
            this.grid('map', viewport.fieldHeight, viewport.fieldWidth, 0, 0, 1, 1);
        }
    }
    
    stepEveryFrame_types = '';
    stepEveryFrame() {
        this.gameInfo = {... this.gameInfo, playerStepEveryFrame: true};
    }

    vp_types = 'int int int int int';
    vp(fieldWidth, fieldHeight, left, top, right) {
        let viewport = createViewportFromScreenshot(fieldWidth, fieldHeight, 16000, left, top, right);
        this.setViewport(viewport);
        console.log(this.gameInfo);
    }

    setViewport(viewport) {
        this.gameInfo = {... this.gameInfo, viewport: viewport};
        this.resized();
    }

    r_types = 'color float float float float';
    r(color, left, top, right, bottom) {
        this.ctx.strokeStyle = color;
        this.contextAdapter.strokeRect(left, top, right-left, bottom-top);
    }

    fr_types = 'color float float float float';
    fr(color, left, top, right, bottom) {
        this.ctx.fillStyle = color;
        this.contextAdapter.fillRect(left, top, right-left, bottom-top);
    }

    tr_types = "color float float float float";
    tr(color, left, top, right, bottom){
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
        this.contextAdapter.fillRect(left, top, right-left, bottom-top);
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = color;
        this.contextAdapter.strokeRect(left, top, right-left, bottom-top);
    }

    c_types = "color float float float";
    c(color, x, y, radius){
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.contextAdapter.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    fc_types = "color float float float";
    fc(color, x, y, radius){
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.contextAdapter.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    tc_types = "color float float float";
    tc(color, x, y, radius){
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.contextAdapter.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    l_types = "color float*";
    l(color, ...ps){
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.contextAdapter.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.contextAdapter.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.stroke();
    }

    fl_types = "color float*";
    fl(color, ...ps){
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.contextAdapter.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.contextAdapter.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.fill();
    }

    tl_types = "color float*";
    tl(color, ...ps){
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.contextAdapter.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.contextAdapter.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    txt_types = "color float float float text";
    txt(color, x, y, fontSize, text){
        this.ctx.fillStyle = color;
        this.ctx.font = fontSize + "px " + this.fontName;
        this.contextAdapter.fillText(text, x, y);
    }

    font_types = "text";
    font(name){
        this.fontName = name;
    }

    clr_types = "";
    clr(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    o_types = "float";
    o(opacity){
        this.canvas.style.opacity = opacity;
    }

    grid_types = "id int int float float float float";
    grid(id, nRows, nCols, left, top, cellWidth, cellHeight){
        this.grids[id] = {id, nRows, nCols, left, top, cellWidth, cellHeight};
    }

    fcell_types = "color id int int";
    fcell(color, gridId, col, row){
        let grid = this.grids[gridId];
        if (!grid) throw new Error(`Unknown grid id: ${gridId}`);
        this.ctx.fillStyle = color;
        this.contextAdapter.fillRect(
            grid.left + grid.cellWidth * col,
            grid.top + grid.cellHeight * row,
            grid.cellWidth,
            grid.cellHeight
        );
    }

    fgrid_types = "color id int*";
    fgrid(color, gridId, ...cells){
        let grid = this.grids[gridId];
        if (!grid) throw new Error(`Unknown grid id: ${gridId}`);
        this.ctx.fillStyle = color;
        for(let i = 0; i < cells.length; i++){
            let index = cells[i];
            let row = Math.floor(index / grid.nCols);
            let col = index % grid.nCols;
            this.contextAdapter.fillRect(
                grid.left + grid.cellWidth * col,
                grid.top + grid.cellHeight * row,
                grid.cellWidth,
                grid.cellHeight
            );
        }
    }
    
    // cell badge
    bgrid_types = "color gridId id int*";
    bgrid(color, gridId, pos, ...cells){
        let grid = this.grids[gridId];
        if (!grid) throw new Error(`Unknown grid id: ${gridId}`);
        this.ctx.fillStyle = color;
        let badgeSize = grid.cellWidth / 3;
        let shiftX = 0;
        let shiftY = 0;
        if (pos.includes('l')) shiftX = -badgeSize;
        if (pos.includes('r')) shiftX = badgeSize;
        if (pos.includes('t')) shiftY = -badgeSize;
        if (pos.includes('b')) shiftY = badgeSize;
        for(let i = 0; i < cells.length; i++){
            let index = cells[i];
            let row = Math.floor(index / grid.nCols);
            let col = index % grid.nCols;
            this.contextAdapter.fillRect(
                grid.left + grid.cellWidth * (col + 0.5) + shiftX - badgeSize/2,
                grid.top + grid.cellHeight * (row + 0.5) + shiftY - badgeSize/2,
                badgeSize,
                badgeSize
            );
        }
    }
    lgrid_types = "color id int*";
    lgrid(color, gridId, ...cells) {
        let grid = this.grids[gridId];
        if (!grid) throw new Error(`Unknown grid id: ${gridId}`);
        let ps = [];
        for(let i = 0; i < cells.length; i++){
            let index = cells[i];
            let row = Math.floor(index / grid.nCols);
            let col = index % grid.nCols;
            let x = grid.left + grid.cellWidth * (col + 0.5);
            let y = grid.top + grid.cellHeight * (row + 0.5);
            ps.push(x);
            ps.push(y);
        }
        this.l(color, ...ps);
    }
}