function onLoad(){
    const md = document.getElementById('markdown');
    document.getElementById('content').innerHTML =
        marked.parse(md.innerText);
}

window.addEventListener("load", onLoad);