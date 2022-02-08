// ==UserScript==
// @name         escgo! colors in webchat - legacy
// @version      0.2
// @description  Adds an option to make text bold/italic?/underlined/colorful in the escgo! chat. I tried to keep it as ES5-friendly as possible.
// @author       Andrei Felix
// @match        http://www.escgo.com/wp-content/uploads/euwebirc-master/static/qui.html
// @match        http://www.escgo.com/wp-content/uploads/euwebirc-master2/static/qui.html
// @icon         http://www.escgo.com/wp-content/uploads/2017/04/cropped-escgologolarge-32x32.png
// @grant        none
// @run-at       document-end
// @downloadURL   https://github.com/a-felix/userscripts/raw/main/eurovision/escgo%20colors%20in%20webchat%20-%20legacy.user.js
// ==/UserScript==

(function() {
	// this function waits until it can find the box you type stuff in
	// it also uses recursion to remember the last step it took, somehow
	// I promise it makes sense
	// couldn't risk using querySelector
	function getTextBox(context, fn) {
		if (context === null) {
			context = document;
		}
		var nextClass, currClasses = "";
		if (context === document) {
			nextClass = "bottomboundpanel";
		}
		else {
			currClasses = context.className.split(" ");
			if (currClasses.indexOf("bottomboundpanel") != -1) {
				nextClass = "input";
			}
			else if (currClasses.indexOf("input") != -1) {
				nextClass = "keyboard-input";
			}
			else {
				nextClass = null;
			}
		}
		if (nextClass === null) {
			return fn(context);
		}
		var result = context.getElementsByClassName(nextClass)[0];
		if (result === undefined) {
			window.setTimeout(function() { getTextBox(context, fn); }, 1000);
			return;
		}
		return getTextBox(result, fn);
	}
	
	// this adds a style element containing everything needed for this script
	// TODO: check whether getComputedStyle works on older browsers
	// no template literals = :(
	function addCustomCss() {
		var ircStyle = getComputedStyle(
			document.getElementsByClassName("lines")[0]
		);
		var bgColor = ircStyle.backgroundColor;
		var fgColor = ircStyle.color;
		var customCss =
			".qwebirc-qui.bottomboundpanel form{padding-right:1.4em}" +
			" #formatArea{position:absolute;width:1.2em;height:1.2em;right:0;" +
			"top:0;bottom:0;margin:0;padding:0}" +
			" #formatBtn{position:relative;width:100%;height:100%;left:0;" +
			"top:0;text-align:center;background-color:#666;content:\"F\";" +
			"font-weight:bold;font-style:italic;text-decoration:underline;" +
			"color:orange}" +
			" #formatMenu{display:none;background:#666;position:absolute;" +
			"bottom:100%;right:0;padding:0.1em 0 0.1em 0.3em;" +
			"border:1px #666 solid;white-space:nowrap;font-size:85%;" +
			"text-align:left} #formatArea:focus #formatMenu," +
			"#formatArea:focus-within #formatMenu," +
			"#formatArea:hover #formatMenu{display:block}" +
			" .formatLabel{color:white;margin-right:0.1em;" +
			"margin-bottom:0.1em;width:5.5em}" +
			" .formatStyleBtn{display:inline-block;opacity:0.9;" +
			"background-color:#ccc;color:black;font-size:95%;" +
			"text-align:center;margin-right:0.3em;margin-bottom:0.1em;" +
			"padding:2px;width:1.2em;height:1.2em;border:1px #666 solid;" +
			"user-select:none;-webkit-user-select:none;-moz-user-select:none;" +
			"-ms-user-select:none;cursor:default}" +
			" .formatStyleBtn:hover{opacity:1;outline:2px #eee solid;" +
			"outline-offset:-1px} .formatStyleBtn:active{opacity:0.65}" +
			" .colourline .formatStyleBtn{opacity:1}" +
			" #formatBoldBtn{font-weight:bold}" +
			" #formatItalicBtn{font-style:italic}" +
			" #formatUnderlineBtn{text-decoration:underline}" +
			" .XcDef{color:" + fgColor + "}" +
			" .XbcDef{background:" + bgColor + "}";
		var cuCss = document.createElement("style");
		cuCss.innerHTML = customCss;
		document.head.appendChild(cuCss);
	}
	
	// this creates labels in my little formatting menu
	function createFormatMenuLabel(text, inline) {
		var label = document.createElement("div");
		label.className = "formatLabel";
		if (inline) {
			label.style.display = "inline-block";
		}
		label.textContent = text;
		return label;
	}
	
	// this is a template used for buttons that affect formatting in some way
	// can't use classList
	function createFormatStyleButton(
		textBox, text, tooltip, id, delim, param, classes
	) {
		var button = document.createElement("div");
		button.className = "formatStyleBtn";
		classes.forEach(function(cl) { button.className += " " + cl; });
		if (id) {
			button.id = id;
		}
		if (tooltip) {
			button.title = tooltip;
		}
		button.addEventListener("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			var ss = textBox.selectionStart;
			var se = textBox.selectionEnd;
			var endTag = delim;
			if (ss == se) {
				endTag = "";
			}
			var currValue = textBox.value;
			textBox.value = currValue.slice(0, ss) + delim + param +
				currValue.slice(ss, se) + endTag + currValue.slice(se);
			textBox.selectionStart = textBox.selectionEnd = se + delim.length +
				param.length + endTag.length;
			textBox.focus();
		});
		button.textContent = text;
		return button;
	}
	
	// custom function because padStart is a fairly new addition to ECMAScript
	// I'm forcing double digits because they're more predictable,
	// especially when posting stuff that already begins with a number,
	// such as chat results
	// some linter told me "" + number was bad
	function compatiblePad2(number) {
		if (number < 10) {
			return "0" + number;
		}
		return String(number);
	}
	
	// this creates the formatting menu; it appears when hovering over the F
	function constructFormatMenu(textBox) {
		var formatMenu = document.createElement("div");
		formatMenu.id = "formatMenu";
		
		// "B", "I", "U", "N" buttons; "N" negates every other tag
		// unlike the web chat, mIRC does recognize italic text
		// TODO: the status of "I" is subject to consideration, ask
		formatMenu.appendChild(createFormatMenuLabel("Font style:", true));
		formatMenu.appendChild(createFormatStyleButton(
			textBox, "B", "bold", "formatBoldBtn", "\x02", "", []
		));
		formatMenu.appendChild(createFormatStyleButton(
			textBox, "I?", "italic?", "formatItalicBtn", "\x1D", "", []
		));
		formatMenu.appendChild(createFormatStyleButton(
			textBox, "U", "underline", "formatUnderlineBtn", "\x1F", "", []
		));
		formatMenu.appendChild(createFormatStyleButton(
			textBox, "N", "normal", undefined, "\x0F", "", []
		));
		
		// I added tooltips because colors are confusing
		// "dark" gray is darker in mIRC, but lighter in browsers
		// the numbers help with readability
		// 0 = color code is shown in white
		// 1 = color code is shown in black
		var colors = [
			["white", 1],
			["black", 0],
			["dark blue", 0],
			["green", 0],
			["red", 0],
			["dark red", 0],
			["purple", 0],
			["orange", 1],
			["yellow", 1],
			["light green", 0],
			["teal", 0],
			["cyan", 1],
			["blue", 0],
			["fuchsia", 0],
			["\"dark\" gray", 1],
			["gray", 0]
		];
		
		formatMenu.appendChild(createFormatMenuLabel("Font colour:", false));
		
		// dummy element because I don't want to redefine the colors
		var dummyColourline = document.createElement("div");
		dummyColourline.className = "colourline";
		
		// this is where the color buttons are actually created
		colors.forEach(function (color, back) {
			var desc = color[0], fore = color[1];
			if ((back != 0) && (back % 6 == 0)) {
				dummyColourline.appendChild(document.createElement("br"));
			}
			dummyColourline.appendChild(createFormatStyleButton(
				textBox, String(back), desc, undefined, "\x03",
				compatiblePad2(back), ["Xc" + fore, "Xbc" + back]
			));
		});
		
		// 2 extra buttons for default formatting + just the symbol
		dummyColourline.appendChild(createFormatStyleButton(
			textBox, "99", "default", undefined, "\x03", "99",
			["XcDef", "XbcDef"]
		));
		dummyColourline.appendChild(createFormatStyleButton(
			textBox, "\x03", "end", undefined, "\x03", "", []
		));
		
		formatMenu.appendChild(dummyColourline);
		return formatMenu;
	}
	
	// this adds the formatting menu to the DOM once the textbox is found
	getTextBox(document, function(textBox) {
		addCustomCss();
		
		var contForm = textBox.parentElement;
		var contDiv = contForm.parentElement;
		
		var formatArea = document.createElement("div");
		formatArea.id = "formatArea";
		
		var formatBtn = document.createElement("div");
		formatBtn.id = "formatBtn";
		formatBtn.textContent = "F";
		
		formatArea.appendChild(formatBtn);
		formatArea.appendChild(constructFormatMenu(textBox));
		contDiv.appendChild(formatArea);
	});
})();