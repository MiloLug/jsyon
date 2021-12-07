document.querySelectorAll(
    'script[type="application/x-jsyon"], script[lang="jsyon"]'
).forEach(element => {
    (new window.jsyon.Global()).eval(element.textContent);
});
