function onShowNextFrameOnLastSubframeChange() {
  chrome.storage.local.set({showNextFrameOnLastSubframe: showNextFrameOnLastSubframe.checked});
}

function onLoad(){
    const md = document.getElementById('markdown');
    document.getElementById('content').innerHTML =
        marked.parse(md.innerText);

    let showNextFrameOnLastSubframe = document.getElementById('showNextFrameOnLastSubframe');
    chrome.storage.local.get(['showNextFrameOnLastSubframe'], function(result) {
        showNextFrameOnLastSubframe.checked = result.showNextFrameOnLastSubframe;
    });
    showNextFrameOnLastSubframe.addEventListener('change', onShowNextFrameOnLastSubframeChange);
       
}

window.addEventListener("load", onLoad);