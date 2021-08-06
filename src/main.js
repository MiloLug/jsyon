document.querySelectorAll(
    'script[type="application/x-hornylang"], script[lang="hornylang"]'
).forEach(element => {
    window.hornylang.Global.eval(element.textContent);
});
