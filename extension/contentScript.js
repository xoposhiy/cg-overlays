function main() {
	console.log(`CG Overlays STARTED at ${window.location}`);

	let rawFrames;
	let gameFrames;
	let ctx;
	let frameIndex;
	let gameName;
	let onOffButton;

	function isPlayerWindow(){
		return document.getElementById("cg-player") != undefined;
	}

	function groupFrames(frames, everyFrame = true){
		let result = [];
		if (!frames) return result;
		for(let i = 0; i < frames.length; i++){
			let frame = frames[i];
			if (frame.keyframe || everyFrame){
				result.push([frame]);
			}
			else{
				result[result.length-1].push(frame);
			}
		}
		return result;
	}

	function detectGameName(view){
		for(let d of detectStrings){
			if (d.substrings.every(s => view.indexOf(s) >= 0)) {
				console.log("Detected gameName: " + d.gameName);
				return d.gameName;
			}
		}
		console.log("not detected... View:");
		console.log(view);
		return null;
	}

	window.addEventListener(
		"message", (function(t) {
			if (onOffButton && !onOffButton.checked) return;
			//if (t.data.type) console.log(t.data.type, t.data);
			if ("viewerOptions" === t.data.type){
				if (isPlayerWindow()){
					if (t.data.gameName)
						gameName = t.data.gameName; 
					else {
						console.log(t.data.type, t.data);
						if (gameFrames) {
							gameName = detectGameName(gameFrames[0][0].view);
						}
					}
					gameName = gameName || "unknown";
					console.log("GameName: " + gameName);
					console.log("Viewport: " + (knownGames[gameName].viewport));
					let everyFrame = knownGames[gameName]?.playerStepEveryFrame == true;
					gameFrames = groupFrames(rawFrames, everyFrame);
					console.log("Game Frames: ", gameFrames);
					initialize();
				}
				else{
					window.frames[0].postMessage(t.data, "*");
				}
			}
			else if ("frames" === t.data.type && t.data.gameInfo){
				rawFrames = t.data.gameInfo.frames;
				if (gameName == "unknown")
					gameName = detectGameName(rawFrames[0].view);
				let everyFrame = knownGames[gameName]?.playerStepEveryFrame == true;
				gameFrames = groupFrames(rawFrames, everyFrame);
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

	function initialize(){
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
		ctx = new Drawer(canvas, originalCanvas);
	}

	function getInstructions(index){
		let result = gameFrames[index]
			.map(frame => frame.stderr?.split('\n'))
			.flat()
			.filter(line => line && line.startsWith("@"));
		if (result.length == 0 && index > 0 && index == frameIndex)
			return getInstructions(index-1);
		result.unshift(knownGames[gameName].viewport);
		return result;
	}

	function renderOverlay(newFrameIndex) {
		if (newFrameIndex == frameIndex) return;
		frameIndex = newFrameIndex;
		if (ctx == null) return;
		console.log("cg overlay draw frame " + frameIndex);
		ctx.canvas.width = ctx.originalCanvas.clientWidth;
		ctx.canvas.height = ctx.originalCanvas.clientHeight;
		let instructions = getInstructions(frameIndex);
		let errors = [];
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