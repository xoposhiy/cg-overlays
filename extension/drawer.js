class Drawer {
    constructor(canvas, originalCanvas, gameName) {
        this.canvas = canvas;
        this.originalCanvas = originalCanvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1.0;
        this.shiftX = 0.0;
        this.shiftY = 0.0;
        this.fontName = 'Arial';
        this.gameInfo = knownGames[gameName] || knownGames['unknown'];
    }

    game_types = 'text';
    game(gameName) {
        this.gameInfo = knownGames[gameName] || knownGames['unknown'];
		let viewport = knownGames[gameName].viewport;
		this.vp(viewport.left, viewport.top, viewport.right, viewport.bottom);
        console.log("GameName: " + gameName + " Viewport: ", viewport);
    }
    
    stepEveryFrame_types = '';
    stepEveryFrame() {
        this.gameInfo = {... this.gameInfo, playerStepEveryFrame: true};
    }

    vp_types = 'int int int int';
    vp(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.shiftX = -left;
        this.shiftY = -top;
        this.canvas.style.top = this.originalCanvas.style.top;
        this.canvas.style.left = this.originalCanvas.style.left;
        this.canvas.style.width = this.originalCanvas.style.width;
        this.canvas.style.height = this.originalCanvas.style.height;
        const sx = this.canvas.clientWidth/(right-left+1);
        const sy = this.canvas.clientHeight/(bottom-top+1);
        this.scale = Math.min(sx, sy);
        this.ctx.setTransform(
            this.scale,     0,          
            0,     this.scale,
            -left*this.scale, 
            -top*this.scale
            );
        this.ctx.lineWidth = 1 / this.scale;
    }

    r_types = 'color int int int int';
    r(color, left, top, right, bottom) {
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(left, top, right-left, bottom-top);
    }

    fr_types = 'color int int int int';
    fr(color, left, top, right, bottom) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(left, top, right-left, bottom-top);
    }

    tr_types = "color int int int int";
    tr(color, left, top, right, bottom){
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillRect(left, top, right-left, bottom-top);
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = color;
        this.ctx.strokeRect(left, top, right-left, bottom-top);
    }

    c_types = "color int int int";
    c(color, x, y, radius){
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    
    fc_types = "color int int int";
    fc(color, x, y, radius){
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    tc_types = " color int int int";
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

    l_types = "color int*";
    l(color, ...ps){
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.ctx.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.stroke();
    }

    fl_types = "color int*";
    fl(color, ...ps){
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(ps[0], ps[1]);
        for(let i = 2; i < ps.length; i+=2){
            this.ctx.lineTo(ps[i], ps[i+1]);
        }
        this.ctx.fill();
    }

    tl_types = "color int*";
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

    txt_types = "color int int float text";
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
}