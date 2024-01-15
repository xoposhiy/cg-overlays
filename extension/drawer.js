class Drawer {
    constructor(canvas, originalCanvas, gameName) {
        this.canvas = canvas;
        this.originalCanvas = originalCanvas;
        this.ctx = canvas.getContext('2d');
        this.contextAdapter = new ContextAdapter(this.ctx, 1.0, 0, 0);
        this.fontName = 'Arial';
        this.gameInfo = knownGames[gameName];
        this.grids = {};
        console.log("Detected GameName: " + gameName);
        console.log(this.gameInfo?.viewport);
    }

    game_types = 'name';
    game(gameName, ...args) {
        let knownGame = knownGames[gameName];
        this.gameInfo = knownGame;
        if (this.gameInfo) {
            let viewport;
            if (knownGame.viewport_fn && !knownGame.viewport) {
                viewport = knownGame.viewport_fn(this, ...args);
            } else {
                viewport = knownGame.viewport;
            }
            this.setViewport(viewport);
        } else {
            throw new Error(`Unknown game ${gameName}. Use !vp instruction to set viewport manually.`);
        }
    }

    stepEveryFrame_types = '';
    stepEveryFrame() {
        this.gameInfo = {... this.gameInfo, playerStepEveryFrame: true};
    }

    vp_types = 'int int int int';
    vp(fieldWidth, left, top, right) {
        let viewport = createViewportFromScreenshot(fieldWidth, 16000, left, top, right);
        this.setViewport(viewport);
    }

    setViewport(viewport) {
        this.canvas.style.top = this.originalCanvas.style.top;
        this.canvas.style.left = this.originalCanvas.style.left;
        this.canvas.style.width = this.originalCanvas.style.width;
        this.canvas.style.height = this.originalCanvas.style.height;
        this.contextAdapter = new ContextAdapter(this.ctx, this.canvas.clientWidth / (viewport.right - viewport.left), -viewport.left, -viewport.top)
        this.gameInfo = {... this.gameInfo, viewport: viewport};
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

    tc_types = " color float float float";
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
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
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
        if (!grid) return;
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
        if (!grid) return;
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

    lgrid_types = "color id int*";
    lgrid(color, gridId, ...cells) {
        let grid = this.grids[gridId];
        if (!grid) return;
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