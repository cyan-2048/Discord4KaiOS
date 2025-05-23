// TODO: fix this?
// there's no longer a reliable way to see the names of these Icons
// I don't think I can create a fix at all >_<

icons = [];
Object.values(Vencord.Webpack.wreq.c).forEach((a) => {
	if (!a.exports) return;
	Object.keys(a.exports).forEach((key) => {
		if (typeof a.exports[key] != "function") return;
		if (key.endsWith("Icon") || a.exports[key].toString().includes("svg")) {
			try {
				const el = document.createElement("div");
				Vencord.Webpack.Common.ReactDOM.render(a.exports[key]({}), el);
				const svg = el.firstElementChild;
				svg.querySelector("[fill]").setAttribute("fill", "currentColor");
				icons.push([key, svg.outerHTML]);
			} catch {}
		}
	});
});
