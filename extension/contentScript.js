function main() {
	console.log(`CG Overlays STARTED at ${window.location}`);

	let rawFrames;
	let drawer;
	let frameIndex;
	let onOffButton;

	window.addEventListener("keydown", function(e) {
		if (drawer?.canvas == null) return;
		if (e.ctrlKey) {
			drawer.canvas.style.pointerEvents = 'auto';
		}
		else{
			drawer.canvas.style.pointerEvents = 'none';
		}
	}, true);

	function isPlayerWindow(){
		return document.getElementById("cg-player") != undefined;
	}

	window.addEventListener(
		"message", (async function(t) {
			if (onOffButton && !onOffButton.checked) return;
			//if (t.data.type) console.log(t.data.type, t.data);
			if ("resize" == t.data.type) {
				console.log(t.data.type, t.data);
				if (isPlayerWindow()){
					this.setTimeout(async () => await renderOverlay(frameIndex, 1), 1000);
				}
				else{
					window.frames[0]?.postMessage(t.data, "*");
				}
			}
			else if ("viewerOptions" === t.data.type){
				console.log(t.data.type, t.data);
				if (isPlayerWindow()){
					let gameName = "unknown";
					if (t.data.gameName && t.data.gameName != "CodinGame")
						gameName = t.data.gameName.replace(/\s/g, '');
					else{
						console.log("Not detectable GameName", t.data);
					}
					initialize(gameName);
				}
				else{
					window.frames[0]?.postMessage(t.data, "*");
				}
			}
			else if ("frames" === t.data.type && t.data.gameInfo){
				rawFrames = t.data.gameInfo.frames;
				console.log("Raw frames:", rawFrames);
				if (drawer) drawer = new Drawer(drawer.canvas, drawer.originalCanvas, drawer.gameName);
			} else if ("progress" == t.data.type){
				if (isPlayerWindow()){
					// console.log(t.data);
					await renderOverlay(t.data.frame, t.data.progress);
				}
				else{
					window.frames[0]?.postMessage(t.data, "*");
				}
			}
		}));

	function deInitialize(){
		if (drawer && drawer.canvas != null){
			drawer.canvas.remove();
			drawer.canvas = null;
		}
		drawer = null;
	}

	function initialize(gameName){
		let canvasContainer = document.getElementsByClassName('canvas-container')[0];
		if (canvasContainer == null) {
			console.error("no canvas container at " + window.location);
			return;
		}
		let originalCanvas = canvasContainer.children[0];
		let existingOverlay = document.getElementById('cgOverlayCanvas');
		if (existingOverlay != null) {
			existingOverlay.remove();
		}
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
			let x = Math.round(ev.clientX * 16000 / canvas.clientWidth);
			let y = Math.round(ev.clientY * 9000 / canvas.clientHeight);
			let message = x  + " " + y;
			let w = c.measureText(message).width;
			c.fillStyle = "black";
			c.fillRect(0, 0, w+20, 36);
			c.fillStyle = "white";
			c.fillText(message, 10, 32);
		}, true);
		if (!onOffButton){
			onOffButton = document.createElement('input');
			onOffButton.id = "cgOverlayOnOffButton";
			onOffButton.type = "checkbox";
			onOffButton.checked = true;
			onOffButton.onchange = function(){
				if (onOffButton.checked){
					initialize(gameName);
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
		drawer = new Drawer(canvas, originalCanvas, gameName);
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

	async function renderOverlay(newFrameIndex, progressValue) {
		if (newFrameIndex == frameIndex && progressValue != 1) return;
		frameIndex = newFrameIndex;
		if (drawer == null) return;
		let options = await chrome.storage?.local?.get(['syncWithVisual']);
		let delta = options?.syncWithVisual && progressValue == 1 ? 1 : 0;
		console.log("renderOverlay frame = " + frameIndex + " delta = " + delta);
		drawer.clr();
		let instructions = getInstructions(frameIndex + delta, drawer.gameInfo);
		let errors = [];
		for(let instruction of instructions){
			let firstSpaceIndex = instruction.indexOf(' ');
			if (firstSpaceIndex < 0) firstSpaceIndex = instruction.length;
			const fn = instruction.slice(1, firstSpaceIndex);
			const args = instruction.substring(firstSpaceIndex+1);
			const f = drawer[fn];
			if (f == undefined) {
				errors.push("Unknown instruction: " + instruction);
				continue;
			}
			let argTypes = drawer[fn + '_types'];
			if (argTypes === undefined) throw new Error("No arg types for " + fn);
			try {
				//console.log(fn, args, argTypes);
				f.apply(drawer, parse(args, argTypes));
			}
			catch(e) {
				errors.push(`Error executing '${instruction}'`);
				errors.push(`    expected format: @${fn} ${argTypes}`);
				errors.push(`    ${e}`);
				continue;
			}
		}
		if (instructions.length > 0 && !drawer.isViewportInitialized()){
			errors = [
				`Viewport is unknown. Use one of two options:`,
				`  1. Use '!game <gameName> <width>? <height>?' instruction for known game`,
				"  2. Use '!vp' instruction for setting viewport manually",
				"     Hold CTRL key and click to visualizer to find out coordinates of the game field corners for vp instruction."
			].concat(errors);
		}
		if (errors.length > 0){
			bsod(drawer, errors);
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
		if (typesString && iType < types.length && !types[iType].endsWith('*') && !types[iType].endsWith('?')) {
			throw new Error(`Expected ${types[iType]} for ${iType} param, but got nothing`);
		}
		if (i < args.length) {
			throw new Error(`Too many arguments: ${args.substring(i)}`);
		}
		return result;
	}
}

function bsod(drawer, errors) {
	drawer.canvas.width = drawer.canvas.clientWidth;
	drawer.canvas.height = drawer.canvas.clientHeight;
	let ctx = drawer.canvas.getContext('2d');
	ctx.fillStyle = "rgba(0,0,255,0.9)";
	ctx.fillRect(0, 0, drawer.canvas.width, drawer.canvas.height);
	ctx.fillStyle = "white";
	ctx.font = "16px monospace";
	let y = 24;
	ctx.fillText("CG Overlay errors:", 32, y);
	y += 24;
	for (let error of errors) {
		ctx.fillText(error, 32, y);
		console.log(error);
		y += 24;
	}
}

main();
