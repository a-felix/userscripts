// ==UserScript==
// @name         escgo! colors in webchat - modern
// @version      0.1
// @description  Adds an option to make text bold/italic?/underlined/colorful in the escgo! chat
// @author       Andrei Felix
// @match        http://www.escgo.com/wp-content/uploads/euwebirc-master/static/qui.html?colors=true
// @match        http://www.escgo.com/wp-content/uploads/euwebirc-master2/static/qui.html?colors=true
// @icon         http://www.escgo.com/wp-content/uploads/2017/04/cropped-escgologolarge-32x32.png
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
	function sleep(ms = 1000) { return new Promise(resolve => { window.setTimeout(resolve, ms) }) }
	
	async function getTextBox() {
		let firstLoop = true, result;
		while (true) {
			if (firstLoop) firstLoop = false; else await sleep();
			result = document.querySelector(".bottomboundpanel .input input.keyboard-input");
			if (result) return result;
		}
	}
	
	function addCustomCss() {
		let ircStyle = getComputedStyle(document.querySelector(".lines"));
		let bgColor = ircStyle.backgroundColor;
		let fgColor = ircStyle.color;
		let customCss = `
.qwebirc-qui.bottomboundpanel form {
	padding-right: 1.4em;
}
#formatArea {
	position: absolute;
	width: 1.2em;
	height: 1.2em;
	right: 0;
	top: 0;
	bottom: 0;
	margin: 0;
	padding: 0;
}
#formatBtn {
	position: relative;
	width: 100%;
	height: 100%;
	left: 0;
	top: 0;
	text-align: center;
	background-color: #666;
	content: "F";
	font-weight: bold;
	font-style: italic;
	text-decoration: underline;
	color: orange;
}
#formatMenu {
	display: none;
	background: #666;
	position: absolute;
	bottom: 100%;
	right: 0;
	padding: 0.1em 0 0.1em 0.3em;
	border: 1px #666 solid;
	white-space: nowrap;
	font-size: 85%;
	text-align: left;
}
#formatArea:focus #formatMenu,
#formatArea:focus-within #formatMenu,
#formatArea:hover #formatMenu {
	display: block;
}
.formatLabel {
	color: white;
	margin-right: 0.1em;
	margin-bottom: 0.1em;
	width: 5.5em;
}
.formatStyleBtn {
	display: inline-block;
	opacity: 0.9;
	background-color: #ccc;
	color: black;
	font-size: 95%;
	text-align: center;
	margin-right: 0.3em;
	margin-bottom: 0.1em;
	padding: 2px;
	width: 1.2em;
	height: 1.2em;
	border: 1px #666 solid;
	user-select: none;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	cursor: default;
}
.formatStyleBtn:hover {
	opacity: 1;
	outline: 2px #eee solid;
	outline-offset: -1px;
}
.formatStyleBtn:active {
	opacity: 0.65;
}
.colourline .formatStyleBtn {
	opacity: 1;
}
#formatBoldBtn {
	font-weight: bold;
}
#formatItalicBtn {
	font-style: italic;
	display: none;
}
#formatUnderlineBtn {
	text-decoration: underline;
}
.XcDef {
	color: rgb(183, 183, 183);
}
.XbcDef {
	background: rgba(0, 0, 0, 0);
}
`
		let cuCss = document.createElement("style");
		cuCss.innerHTML = customCss;
		document.head.appendChild(cuCss);
	}
	
	function createFormatMenuLabel(text, inline) {
		let label = document.createElement("div");
		label.className = "formatLabel";
		if (inline) label.style.display = "inline-block";
		label.textContent = text;
		return label;
	}
	
	function createFormatStyleButton(textBox, text, tooltip, id, delim = "", param = "", classes = []) {
		let button = document.createElement("div");
		button.classList.add("formatStyleBtn");
		classes.forEach(cl => { button.classList.add(cl) });
		if (id) button.id = id;
		if (tooltip) button.title = tooltip;
		button.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			let ss = textBox.selectionStart;
			let se = textBox.selectionEnd;
			let endTag = delim;
			if (ss == se) endTag = "";
			let currValue = textBox.value;
			textBox.value = currValue.slice(0, ss) + delim + param + currValue.slice(ss, se) + endTag + currValue.slice(se);
			textBox.selectionStart = textBox.selectionEnd = se + delim.length + param.length + endTag.length;
			textBox.focus();
		});
		button.textContent = text;
		return button;
	}
	
	function constructFormatMenu(textBox) {
		let formatMenu = document.createElement("div");
		formatMenu.id = "formatMenu";
		
		formatMenu.appendChild(createFormatMenuLabel("Font style:", true));
		formatMenu.appendChild(createFormatStyleButton(textBox, "B", "bold", "formatBoldBtn", "\x02", "", []));
		formatMenu.appendChild(createFormatStyleButton(textBox, "I?", "italic?", "formatItalicBtn", "\x1D", "", []));
		formatMenu.appendChild(createFormatStyleButton(textBox, "U", "underline", "formatUnderlineBtn", "\x1F", "", []));
		formatMenu.appendChild(createFormatStyleButton(textBox, "N", "normal", undefined, "\x0F", "", []));
		
		let colors = [
			["white", 1], ["black", 0], ["dark blue", 0], ["green", 0], ["red", 0], ["dark red", 0],
			["purple", 0], ["orange", 1], ["yellow", 1], ["light green", 0], ["teal", 0], ["cyan", 1], ["blue", 0],
			["fuchsia", 0], ["\"dark\" gray", 1], ["gray", 0]
		];
		
		formatMenu.appendChild(createFormatMenuLabel("Font color:", false));
		
		let dummyColourline = document.createElement("div");
		dummyColourline.classList.add("colourline");
		
		colors.forEach((color, back) => {
			let desc = color[0], fore = color[1];
			if ((back != 0) && (back % 6 == 0)) dummyColourline.appendChild(document.createElement("br"));
			dummyColourline.appendChild(createFormatStyleButton(textBox, String(back), desc, undefined, "\x03", String(back).padStart(2, "0"), ["Xc" + fore, "Xbc" + back]));
		});
		
		dummyColourline.appendChild(createFormatStyleButton(textBox, "99", "default", undefined, "\x03", "99", ["XcDef", "XbcDef"]));
		dummyColourline.appendChild(createFormatStyleButton(textBox, "\x03", "end", undefined, "\x03", "", []));
		
		formatMenu.appendChild(dummyColourline);
		return formatMenu;
	}
	
	getTextBox().then(textBox => {
		addCustomCss();
		
		let contForm = textBox.parentElement;
		let contDiv = contForm.parentElement;
		
		let formatArea = document.createElement("div");
		formatArea.id = "formatArea";
		
		let formatBtn = document.createElement("div");
		formatBtn.id = "formatBtn";
		formatBtn.textContent = "F";
		
		formatArea.appendChild(formatBtn);
		formatArea.appendChild(constructFormatMenu(textBox));
		contDiv.appendChild(formatArea);
	});
})();