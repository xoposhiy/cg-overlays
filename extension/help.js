function onSyncWithVisualChange() {
  chrome.storage.local.set({syncWithVisual: syncWithVisual.checked});
}

async function onLoad(){
    const md = document.getElementById('markdown');
    document.getElementById('content').innerHTML =
        marked.parse(md.innerText);

    let syncWithVisual = document.getElementById('syncWithVisual');
    let result = await chrome.storage.local.get(['syncWithVisual']);
    syncWithVisual.checked = result.syncWithVisual;
    syncWithVisual.addEventListener('change', onSyncWithVisualChange);
       
}

window.addEventListener("load", onLoad);