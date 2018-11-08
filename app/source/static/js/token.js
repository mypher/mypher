// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

//# sourceURL=token.js

function Token(d) {
	this.div = d.div;
	this.mode = d.mode;
	this.data = {};
}


Token.prototype = {
	get : async function() {
	},

	set : async function() {
		this.data = data;
		Util.setData(this.div, this.data);
	},

	save : async function() {
	},

	draw : async function() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		}
		await this.refresh();
	},

	current : async function() {
	},

	mkButton : function() {
		const btns = [];
		switch (this.mode) {
		case MODE.NEW:
			btns.push({
				text : 'CREATE',
				click : () => {
					this.create();
				}
			});
			btns.push({
				text : 'BACK',
				click : () => {
					History.back();
				}
			});
			break;
		case MODE.EDIT:
			btns.push({
				text : 'COMMIT',
				click : () => {
					this.commit();
				}
			});
			btns.push({
				text : 'CANCEL',
				click : () => {
					this.cancel();
				}
			});
			break;
		case MODE.REF:
			btns.push({
				text : 'BACK',
				click : () => {
					History.back();
				}
			});
			break;
		}
		return btns;
	},

	refresh : async function() {
		const btn = this.mkButton();
		await Util.load(this.div, 'parts/token.html', this.mode, {
			trigger : [{
				click : () => {
					alert(1);
				}
			},{
				click : () => {
					alert(2);
				}
			}],
			button : btn,
			issuer : {
				click : () => {
					return true;
				}
			}
		});
		this.set(this.data);
	}

};
