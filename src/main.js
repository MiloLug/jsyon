document.querySelectorAll('script[type="application/x-hornylang"]').forEach(element => {
	window.hornylang.Global.eval(element.textContent);
});
