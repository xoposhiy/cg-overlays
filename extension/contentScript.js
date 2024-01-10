function main() {
	console.log(`CG Overlays STARTED at ${window.location}`);

	let originalCanvas;
	let gameFrames;
	let ctx;
	let frameIndex;
	let iFrame;
	let gameName;
	let onOffButton;

	function isPlayerWindow(){
		return document.getElementById("cg-player") != undefined;
	}

	function groupFrames(frames){
		let result = [];
		for(let i = 0; i < frames.length; i++){
			let frame = frames[i];
			if (frame.keyframe){
				result.push([frame]);
			}
			else{
				result[result.length-1].push(frame);
			}
		}
		return result;
	}

	window.addEventListener(
		"message", (function(t) {
			if (onOffButton && !onOffButton.checked) return;
			if ("viewerOptions" === t.data.type){
				if (isPlayerWindow()){
					gameName = t.data.gameName; 
					console.log("GameName: " + gameName);
					console.log("Viewport: " + (viewports[gameName] || defaultViewport));
					initialize();
				}
				else{
					window.frames[0].postMessage(t.data, "*");
				}
			}
			else if ("frames" === t.data.type && t.data.gameInfo){
				gameFrames = groupFrames(t.data.gameInfo.frames);
				console.log("Game Frames: ", gameFrames);
			} else if ("progress" == t.data.type){
				if (isPlayerWindow()){
					renderOverlay(t.data.frame);
				}
				else{
					window.frames[0].postMessage(t.data, "*");
				}
			}
		}));

	function deInitialize(){
		if (ctx && ctx.canvas != null){
			ctx.canvas.remove();
			ctx.canvas = null;
		}
		ctx = null;
	}

	function initialize(){
		let canvasContainer = document.getElementsByClassName('canvas-container')[0];
		if (canvasContainer == null) {
			console.error("no canvas container at " + window.location);
			return;
		}
		originalCanvas = canvasContainer.children[0];
		let canvas = document.createElement('canvas');
		canvas.id = "cgOverlayCanvas";
		canvas.style.position = 'absolute';
		canvas.style.opacity = 0.7;
		canvas.style.zIndex = 1000;
		canvas.style.pointerEvents = 'none';
		originalCanvas.insertAdjacentElement('afterEnd', canvas);
		if (!onOffButton){
			onOffButton = document.createElement('input');
			onOffButton.id = "cgOverlayOnOffButton";
			onOffButton.type = "checkbox";
			onOffButton.checked = true;
			onOffButton.onchange = function(){
				if (onOffButton.checked){
					initialize();
				}
				else{
					deInitialize();
				}
			}
			onOffButton.style.position = 'absolute';
			onOffButton.style.zIndex = 1000;
			onOffButton.style.top = '0px';
			onOffButton.style.left = '0px';
			onOffButton.style.backgroundColor = 'white';
		}
		canvas.insertAdjacentElement('afterEnd', onOffButton);
		ctx = createContext(canvas, originalCanvas);
	}

	function tryParse(s){
		const n = +s;
		if (isNaN(n)) return s;
		return n;	
	}

	function renderOverlay(newFrameIndex) {
		if (newFrameIndex == frameIndex) return;
		frameIndex = newFrameIndex;
		if (ctx == null) return;
		ctx.canvas.width = originalCanvas.clientWidth;
		ctx.canvas.height = originalCanvas.clientHeight;
		let instructions = gameFrames[frameIndex]
			.map(frame => frame.stderr?.split('\n'))
			.flat()
			.filter(line => line && line.startsWith("@"));
		instructions.unshift(viewports[gameName] || defaultViewport);
		for(let instruction of instructions){
			console.log(instruction);
			const firstSpaceIndex = instruction.indexOf(' ');
			const fn = instruction.slice(1, firstSpaceIndex);
			const args = instruction.substring(firstSpaceIndex+1);
			const f = ctx[fn];
			if (f == undefined) {
				console.error("Unknown instruction: " + instruction)
				continue;
			}
			f.apply(ctx, [args]);
		}
	}

	function createContext(canvas){
		return {
			scale: 1.0,
			shiftX: 0.0,
			shiftY: 0.0,
			canvas: canvas,
			ctx: canvas.getContext("2d"),
			clr: function(){
				ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
			},
			o: function(args){
				canvas.opacity = +args[0];
			},
			vp: function(args){
				let [left, top, right, bottom] = [...args.split(' ').map(tryParse)];
				this.shiftX = -left;
				this.shiftY = -top;
				canvas.style.top = originalCanvas.style.top;
				canvas.style.left = originalCanvas.style.left;
				canvas.style.width = originalCanvas.style.width;
				canvas.style.height = originalCanvas.style.height;
				const sx = canvas.clientWidth/(right-left+1);
				const sy = canvas.clientHeight/(bottom-top+1);
				this.scale = Math.min(sx, sy);
			},
			r: function(args){
				let [left, top, right, bottom, color] = [...args.split(' ').map(tryParse)];
				this.ctx.strokeStyle = color;
				this.ctx.strokeRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
			},
			fr: function(args){
				let [left, top, right, bottom, color] = [...args.split(' ').map(tryParse)];
				this.ctx.fillStyle = color;
				this.ctx.fillRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
			},
			tr: function(args){
				let [left, top, right, bottom, color] = [...args.split(' ').map(tryParse)];
				this.ctx.fillStyle = color;
				this.ctx.globalAlpha = 0.7;
				this.ctx.fillRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
				this.ctx.globalAlpha = 1.0;
				this.ctx.strokeStyle = color;
				this.ctx.strokeRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
			},
			c: function(args){
				let [x, y, radius, color] = [...args.split(' ').map(tryParse)];
				this.ctx.strokeStyle = color;
				this.ctx.beginPath();
				this.ctx.arc(this.scale*(x+this.shiftX), this.scale*(y+this.shiftY), this.scale*radius, 0, 2 * Math.PI);
				this.ctx.stroke();
			},
			fc: function(args){
				let [x, y, radius, color] = [...args.split(' ').map(tryParse)];
				this.ctx.fillStyle = color;
				this.ctx.beginPath();
				this.ctx.arc(this.scale*(x+this.shiftX), this.scale*(y+this.shiftY), this.scale*radius, 0, 2 * Math.PI);
				this.ctx.fill();
			},
			tc: function(args){
				let [x, y, radius, color] = [...args.split(' ').map(tryParse)];
				this.ctx.fillStyle = color;
				this.ctx.globalAlpha = 0.7;
				this.ctx.beginPath();
				this.ctx.arc(this.scale*(x+this.shiftX), this.scale*(y+this.shiftY), this.scale*radius, 0, 2 * Math.PI);
				this.ctx.fill();
				this.ctx.globalAlpha = 1.0;
				this.ctx.strokeStyle = color;
				this.ctx.stroke();
			},
			l: function(args){
				let ps = args.split(' ').map(tryParse);
				this.ctx.strokeStyle = ps[0];
				this.ctx.beginPath();
				this.ctx.moveTo(this.scale*(ps[1]+this.shiftX), this.scale*(ps[2]+this.shiftY));
				for(let i = 3; i < ps.length; i+=2){
					this.ctx.lineTo(this.scale*(ps[i]+this.shiftX), this.scale*(ps[i+1]+this.shiftY));
				}
				this.ctx.stroke();
			},
			txt: function(args){
				let ps = args.split(' ').map(tryParse);
				let [x, y, color] = [...ps];
				let text = ps.slice(3).join(' ');
				this.ctx.fillStyle = color;
				this.ctx.font = "10px Arial";
				this.ctx.fillText(text, this.scale*(x+this.shiftX), this.scale*(y+this.shiftY));
			},
		};
	}
}

main();