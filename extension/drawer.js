class Drawer {
    constructor(canvas, originalCanvas, gameName) {
        this.canvas = canvas;
        this.originalCanvas = originalCanvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1.0;
        this.shiftX = 0.0;
        this.shiftY = 0.0;
        this.fontName = 'Arial';
        this.gameInfo = knownGames[gameName];
        this.grids = {};
        console.log("GameName: " + gameName);
        console.log(this.gameInfo?.viewport);
    }

    game_types = 'text';
    game(gameName) {
        this.gameInfo = knownGames[gameName];
        console.log("GameName: " + gameName);
        if (this.gameInfo){
            let viewport = knownGames[gameName].viewport;
            this.setViewport(viewport);
        }
        else{
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
        this.scale = this.canvas.clientWidth / (viewport.right - viewport.left);
        this.ctx.setTransform(
            this.scale, 0,
            0, this.scale,
            -viewport.left * this.scale,
            -viewport.top * this.scale
        );
        this.ctx.lineWidth = 1 / this.scale;
        this.gameInfo = {... this.gameInfo, viewport: viewport};
    }

    r_types = 'color float float float float';
    r(color, left, top, right, bottom) {
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(left, top, right-left, bottom-top);
    }

    fr_types = 'color float float float float';
    fr(color, left, top, right, bottom) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(left, top, right-left, bottom-top);
    }

    tr_types = "color float float float float";
    tr(color, left, top, right, bottom){
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillRect(left, top, right-left, bottom-top);
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(left, top, right-left, bottom-top);
    }

    c_types = "color float float float";
    c(color, x, y, radius){
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    
    fc_types = "color float float float";
    fc(color, x, y, radius){
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    tc_types = " color float float float";
    tc(color, x, y, radius){
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    l_types = "color float*";
    l(color, ...ps){
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.ctx.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.stroke();
    }

    fl_types = "color float*";
    fl(color, ...ps){
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.ctx.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.fill();
    }

    tl_types = "color float*";
    tl(color, ...ps){
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.ctx.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    }

    txt_types = "color float float float text";
    txt(color, x, y, fontSize, text){
        this.ctx.fillStyle = color;
        this.ctx.font = fontSize/this.scale + "px " + this.fontName;
        this.ctx.fillText(text, x, y);
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
        console.log(this.grids);
    }

    fcell_types = "color id int int";
    fcell(color, gridId, col, row){
        let grid = this.grids[gridId];
        if (!grid) return;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
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
            console.log("fill cell ", row, col);
            this.ctx.fillRect(
                grid.left + grid.cellWidth * col,
                grid.top + grid.cellHeight * row,
                grid.cellWidth,
                grid.cellHeight
            );
        }
    }
}