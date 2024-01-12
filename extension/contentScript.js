function main() {
	console.log(`CG Overlays STARTED at ${window.location}`);

	let rawFrames;
	let ctx;
	let frameIndex;
	let onOffButton;

	window.addEventListener("keydown", function(e) {
		if (ctx?.canvas == null) return;
		if (e.ctrlKey) {
			ctx.canvas.style.pointerEvents = 'auto';
		}
		else{
			ctx.canvas.style.pointerEvents = 'none';
		}
	}, true);

	function isPlayerWindow(){
		return document.getElementById("cg-player") != undefined;
	}

	window.addEventListener(
		"message", (function(t) {
			if (onOffButton && !onOffButton.checked) return;
			//if (t.data.type) console.log(t.data.type, t.data);
			if ("viewerOptions" === t.data.type){
				if (isPlayerWindow()){
					let gameName = "unknown";
					if (t.data.gameName)
						gameName = t.data.gameName;
					console.log("GameName: " + gameName);
					initialize(gameName);
				}
				else{
					window.frames[0].postMessage(t.data, "*");
				}
			}
			else if ("frames" === t.data.type && t.data.gameInfo){
				rawFrames = t.data.gameInfo.frames;
				console.log("Raw frames:", rawFrames)
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

	function initialize(gameName){
		let canvasContainer = document.getElementsByClassName('canvas-container')[0];
		if (canvasContainer == null) {
			console.error("no canvas container at " + window.location);
			return;
		}
		let originalCanvas = canvasContainer.children[0];
		let canvas = document.createElement('canvas');
		canvas.id = "cgOverlayCanvas";
		canvas.style.position = 'absolute';
		canvas.style.opacity = 0.7;
		canvas.style.zIndex = 1000;
		canvas.style.pointerEvents = 'none';
		originalCanvas.insertAdjacentElement('afterEnd', canvas);

		canvas.addEventListener('mousemove', ev => {
			if (!ev.ctrlKey) return;
			let c = canvas.getContext('2d');
			let t = c.getTransform();
			c.resetTransform();			
			let x = Math.round(ev.clientX * 16000 / canvas.clientWidth);
			let y = Math.round(ev.clientY * 9000 / canvas.clientHeight);
			let message = x  + " " + y;
			let w = c.measureText(message).width;
			c.fillStyle = "black";
			c.fillRect(0, 0, w+20, 36);
			c.fillStyle = "white";
			c.fillText(message, 10, 32);
			c.setTransform(t);
		}, true);
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
		ctx = new Drawer(canvas, originalCanvas, gameName);
	}

	function getKeyFrameIndex(keyFrameIndex){
		let keyFramesCount = 0;
		for(let i=0; i<rawFrames.length; i++){
			if (rawFrames[i].keyframe) {
				if (keyFramesCount == keyFrameIndex)
					return i;
				keyFramesCount++;
			}
		}
		throw new Error("No keyframe with index " + keyFrameIndex + " Try instruction !stepEveryFrame in your stderr before game starts.");
	}

	function getInstructions(index, gameInfo){
		// get all stderr from all previous frames
		var everyFrame = gameInfo?.playerStepEveryFrame || false;
		var rawFrameIndex = everyFrame ? index : getKeyFrameIndex(index);
		while (rawFrameIndex > 0) {
			if (rawFrames[rawFrameIndex].stderr) break;
			rawFrameIndex--;
		}
		let result = (rawFrames[rawFrameIndex].stderr?.split('\n') || [])
			.flat()
			.filter(line => line && line.startsWith("@"));
		let prevInstructions = rawFrames.slice(0, rawFrameIndex+1)
			.map(frame => frame.stderr?.split('\n')).flat()
			.filter(line => line && line.startsWith("!"));
		return prevInstructions.concat(result);
	}

	function renderOverlay(newFrameIndex) {
		if (newFrameIndex == frameIndex) return;
		frameIndex = newFrameIndex;
		if (ctx == null) return;
		console.log("renderOverlay frame = " + frameIndex);
		ctx.canvas.width = ctx.originalCanvas.clientWidth;
		ctx.canvas.height = ctx.originalCanvas.clientHeight;
		let instructions = getInstructions(frameIndex, ctx.gameInfo);
		let errors = [];
		if (ctx.gameInfo){
			let viewport = ctx.gameInfo.viewport;
			ctx.setViewport(viewport);
		}
		for(let instruction of instructions){
			let firstSpaceIndex = instruction.indexOf(' ');
			if (firstSpaceIndex < 0) firstSpaceIndex = instruction.length;
			const fn = instruction.slice(1, firstSpaceIndex);
			const args = instruction.substring(firstSpaceIndex+1);
			const f = ctx[fn];
			if (f == undefined) {
				errors.push("Unknown instruction: " + instruction);
				continue;
			}
			let argTypes = ctx[fn + '_types'];
			if (argTypes === undefined) throw new Error("No arg types for " + fn);
			try {
				//console.log(fn, args, argTypes);
				f.apply(ctx, parse(args, argTypes));
			}
			catch(e) {
				errors.push(`Error executing '${instruction}'`);
				errors.push(`    expected format: @${fn} ${argTypes}`);
				errors.push(`    ${e}`);
				continue;
			}
		}
		if (ctx.gameInfo == null){
			errors.push("Unknown game. Use !vp instruction to set viewport manually.");
			errors.push("Hold CTRL key to find out coordinates of the game field corners");
		}
		if (errors.length > 0){
			ctx.ctx.resetTransform();
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
		while (i < args.length && iType < types.length){
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
}

main();