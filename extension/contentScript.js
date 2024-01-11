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
		let errors = [];
		for(let instruction of instructions){
			//console.log(instruction);
			const firstSpaceIndex = instruction.indexOf(' ');
			const fn = instruction.slice(1, firstSpaceIndex);
			const args = instruction.substring(firstSpaceIndex+1);
			const f = ctx[fn];
			if (f == undefined) {
				errors.push("Unknown instruction: " + instruction);
				continue;
			}
			let argTypes = ctx[fn + '_types'];
			if (!argTypes) throw new Error("No arg types for " + fn);
			try {
				f.apply(ctx, parse(args, argTypes));
			}
			catch(e) {
				errors.push(`Error executing '${instruction}'`);
				errors.push(`    expected format: @${fn} ${argTypes}`);
				errors.push(`    ${e}`);
				continue;
			}
		}
		if (errors.length > 0){
			ctx.canvas.style.opacity = 0.7;
			ctx.ctx.fillStyle = "rgba(0,0,255,0.5)";
			ctx.ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
			ctx.ctx.fillStyle = "white";
			ctx.ctx.font = "14px monospace";
			let y = 64;
			ctx.ctx.fillText("CG Overlay bad instructions in stderr:", y, 48);
			y+=16;
			for(let error of errors){
				ctx.ctx.fillText(error, 64, y);
				y+=16;
			}
		}
	}

	function parse(args, typesString){
		
		let types = typesString.split(' ');
		let i = 0;
		let iType = 0;
		
		function readUntilSpace(){
			let res = '';
			while(i < args.length && args[i] != ' '){
				res += args[i];
				i++;
			}
			if (i < args.length)
				i++;
			return res;			
		}

		function parseOne(type){
			if (type == 'text'){
				let res = args.substring(i);
				i = args.length;
				return res;
			}
			let token = readUntilSpace();
			if (type == 'int'){
				if (!/^-?\d+$/.test(token)){
					throw new Error(`Expected int, but got ${token}`);
				}
				return +token;
			}
			if (type == 'float'){
				if (!/^-?\d+(\.\d+)?$/.test(token)){
					throw new Error(`Expected float, but got ${token}`);
				}
				return +token;
			}
			return token;
		}

		let result = [];
		while (i < args.length){
			let type = types[iType];
			if (type.endsWith('*'))
				type = type.slice(0, -1);
			else
				iType++;
			let value = parseOne(type);
			result.push(value);
		}
		return result;	
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

			o_types: "float",
			o: function(opacity){
				this.canvas.style.opacity = opacity;
			},

			vp_types: "int int int int",
			vp: function(left, top, right, bottom){
				this.shiftX = -left;
				this.shiftY = -top;
				this.canvas.style.top = originalCanvas.style.top;
				this.canvas.style.left = originalCanvas.style.left;
				this.canvas.style.width = originalCanvas.style.width;
				this.canvas.style.height = originalCanvas.style.height;
				const sx = canvas.clientWidth/(right-left+1);
				const sy = canvas.clientHeight/(bottom-top+1);
				this.scale = Math.min(sx, sy);
			},
			r_types: "int int int int color",
			r: function(left, top, right, bottom, color){
				this.ctx.strokeStyle = color;
				this.ctx.strokeRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
			},
			fr_types: "int int int int color",
			fr: function(left, top, right, bottom, color){
				this.ctx.fillStyle = color;
				this.ctx.fillRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
			},
			tr_types: "int int int int color",
			tr: function(left, top, right, bottom, color){
				this.ctx.fillStyle = color;
				this.ctx.globalAlpha = 0.7;
				this.ctx.fillRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
				this.ctx.globalAlpha = 1.0;
				this.ctx.strokeStyle = color;
				this.ctx.strokeRect(this.scale*(left+this.shiftX), this.scale*(top+this.shiftY), this.scale*(right-left), this.scale*(bottom-top));
			},
			c_types: "int int int color",
			c: function(x, y, radius, color){
				this.ctx.strokeStyle = color;
				this.ctx.beginPath();
				this.ctx.arc(this.scale*(x+this.shiftX), this.scale*(y+this.shiftY), this.scale*radius, 0, 2 * Math.PI);
				this.ctx.stroke();
			},
			fc_types: "int int int color",
			fc: function(x, y, radius, color){
				this.ctx.fillStyle = color;
				this.ctx.beginPath();
				this.ctx.arc(this.scale*(x+this.shiftX), this.scale*(y+this.shiftY), this.scale*radius, 0, 2 * Math.PI);
				this.ctx.fill();
			},
			tc_types: "int int int color",
			tc: function(x, y, radius, color){
				this.ctx.fillStyle = color;
				this.ctx.globalAlpha = 0.7;
				this.ctx.beginPath();
				this.ctx.arc(this.scale*(x+this.shiftX), this.scale*(y+this.shiftY), this.scale*radius, 0, 2 * Math.PI);
				this.ctx.fill();
				this.ctx.globalAlpha = 1.0;
				this.ctx.strokeStyle = color;
				this.ctx.stroke();
			},
			l_types: "color int*",
			l: function(color, ...ps){
				this.ctx.strokeStyle = color;
				this.ctx.beginPath();
				this.ctx.moveTo(this.scale*(ps[0]+this.shiftX), this.scale*(ps[1]+this.shiftY));
				for(let i = 2; i < ps.length; i+=2){
					this.ctx.lineTo(this.scale*(ps[i]+this.shiftX), this.scale*(ps[i+1]+this.shiftY));
				}
				this.ctx.stroke();
			},
			txt_types: "int int color text",
			txt: function(x, y, color, text){
				this.ctx.fillStyle = color;
				this.ctx.font = "10px Arial";
				this.ctx.fillText(text, this.scale*(x+this.shiftX), this.scale*(y+this.shiftY));
			},
		};
	}
}

main();