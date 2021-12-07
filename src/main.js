document.querySelectorAll(
    'script[type="application/x-jsyon"], script[lang="jsyon"]'
).forEach(element => {
    window.jsyon.Global.eval(element.textContent);
});
