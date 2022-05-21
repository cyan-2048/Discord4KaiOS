const sn = SpatialNavigation;
sn.init();
sn.add({
	selector: "input,button",
});
sn.makeFocusable();
sn.focus();

let activityHandler;
let discord = new DiscordXHR();

let { token_con, mfa_con, mfa_inp, mfa_login, token_inp, token_login, token_file, token_qr, email, password, login, token } = (() => {
	obj = {};
	qsa("button,input,div[id]").forEach((a) => (obj[a.id] = a));
	return obj;
})();

function required(el) {
	if (el.classList.contains("red")) return;
	el.innerHTML += " - <i>This field is required</i>";
	el.classList.add("red");
}

function loading(el) {
	el.innerHTML = '<div class="dot-flashing"></div>';
}

function testToken(authorization) {
	return discord.xhrRequestJSON("get", "users/@me/settings", { authorization }).then((a) => {
		if (a.code === 0) throw a;
		else return a;
	});
}

function mfa(ticket) {
	mfa_inp.value = "";
	mfa_con.classList.add("open");
	actEl().blur();
	sn.focus();

	let sep = mfa_con.qs(".separator");

	mfa_login.onkeydown = function (e) {
		if (e.key != "Enter") return;
		let len = mfa_inp.value.length;
		let val = Number(mfa_inp.value);
		if (isNaN(val) || len < 0 || len > 8) {
			let list = sep.classList;
			if (!list.contains("invalid")) {
				list.add("red");
				list.add("invalid");
				sep.innerHTML += "<i> - Invalid two-factor auth ticket</i>";
			}
		} else {
			loading(this);
			let terminate = () => (this.innerText = "Login");
			discord.xhrRequestJSON("post", "auth/mfa/totp", {}, { ticket, code: String(val) }).then((r) => {
				if (!r.token) {
					alert("Error: " + JSON.stringify(r));
					return;
				} else
					testToken(r.token).then(
						() => {
							terminate();
							activityHandler.postResult(r.token);
							window.close();
						},
						(e) => {
							terminate();
							alert("Error :" + JSON.stringify(e));
						}
					);
			});
		}
	};
}

function oninput() {
	if (login.classList.contains("loading")) return;
	let em = email.value,
		pass = password.value;

	if (!pass) required(getId("pass-thing"));
	if (!em) required(getId("email-thing"));
	if (!em || !password) return;
	login.classList.add("loading");
	loading(login);
	discord.xhrRequestJSON("post", "auth/login", {}, { email: em, password: pass }).then((a) => {
		login.classList.remove("loading");
		login.innerText = "Login";
		if (a.errors) return alert(a.message);
		if (a.captcha_service) {
			return alert("you are being captcha-ed! please use a token instead.");
		}
		if (a.mfa) return mfa(a.ticket);
		testToken(a.token).then(
			() => {
				activityHandler.postResult(a.token);
				window.close();
			},
			(e) => alert("Error :" + JSON.stringify(e))
		);
	});
}

function move(len) {
	let el = actEl();
	let length = el.value.length;
	if (len > length) len = length;
	if (len < 0) len = 0;
	el.selectionEnd = len;
	el.selectionStart = len;
}

login.addEventListener("sn:enter-down", oninput);
password.addEventListener("sn:enter-down", oninput);
email.addEventListener("sn:enter-down", () => sn.move("down"));
window.addEventListener("sn:willmove", (e) => {
	let {
		detail: { direction },
		target,
	} = e;
	if (/left|right/.test(direction) && target.tagName == "INPUT") {
		move(target.selectionStart + (direction == "left" ? -1 : 1));
	}
});

function goBack() {
	let el = qs(".open");
	if (el) {
		el.classList.remove("open");
		actEl().blur();
		sn.focus();
	} else {
		activityHandler.postError("cancelled");
		window.close();
	}
}

qsa("[id$='back']").forEach((a) => a.addEventListener("sn:enter-down", goBack));

window.addEventListener("keydown", (e) => {
	if (e.key == "Backspace") {
		e.preventDefault();
		goBack();
	}
});

token.addEventListener("sn:enter-down", () => {
	token_con.classList.add("open");
	actEl().blur();
	sn.focus();
});

token_login.addEventListener("sn:enter-down", function () {
	loading(this);
	if (!token_inp.value) {
		this.innerText = "Login";
		required(token_con.qs(".separator"));
	} else {
		activityHandler.postResult(token_inp.value);
	}
});

document.addEventListener("sn:focused", (e) => {
	let { target } = e;
	const rect = target.getBoundingClientRect();
	const elY = rect.top - 0 + rect.height / 2;
	document.body.parentNode.scrollBy({
		left: 0,
		top: elY - window.innerHeight / 2,
		behavior: "smooth",
	});
});

token_qr.addEventListener("sn:enter-down", function () {
	let text = this.innerText;
	let terminate = () => (this.innerText = text);
	loading(this);
	new MozActivity({ name: "@discord_qr" }).onsuccess = function () {
		terminate();
		token_inp.value = this.result;
	};
});

token_file.addEventListener("sn:enter-down", function () {
	let text = this.innerText;
	loading(this);
	let terminate = (e) => {
		this.innerText = text;
		if (e) token_inp.value = e;
	};
	fetch("/token.txt")
		.then((r) => r.text())
		.then((r) => {
			if (r.includes("\n")) {
				throw r;
			}
			terminate(r);
		})
		.catch(() => {
			let e = new MozActivity({ name: "pick", data: { type: "text/plain" } });
			function success() {
				let blob = e.result.blob;
				if (!blob || blob.type !== "text/plain") {
					e = { error: { name: "Not a text file!", message: `the blob type was: ` + blob.type } };
					return error();
				}
				let url = URL.createObjectURL(blob);
				fetch(url)
					.then((r) => r.text())
					.then((r) => {
						URL.revokeObjectURL(url);
						terminate(r);
					});
			}
			function error() {
				if (e.error.name == "NO_PROVIDER") {
					e = new MozActivity({ name: "pick" });
					e.onsuccess = success;
					e.onerror = error;
				} else {
					terminate();
					alert("an error occured while getting the file." + `\n${e.error.name || ""} \n${e.error.message || ""}`);
				}
			}
			e.onerror = error;
			e.onsuccess = success;
		});
});

navigator.mozSetMessageHandler("activity", (e) => {
	activityHandler = e;
});
