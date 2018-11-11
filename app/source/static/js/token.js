// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function Token(d) {
	this.div = d.div;
	this.mode = d.mode;
	this.data = {};
}

Token.prototype = {
	get : function() {
		this.data = Util.getData(this.div, {});
		return this.data;
	},

	set : async function(data) {
		this.data = data;
		Util.setData(this.div, this.data);
		this.grayAttr(this.data.type, this.data.when);
	},

	save : async function() {
	},

	draw : async function() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		} else {
			this.data.type = 0;
			this.data.when = 0;
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

	grayAttr : async function(type, when) {
		let tokenname = true;
		let taskname = true;
		let reftoken = true;
		let term = true;
		let nofdevtoken = true;
		if (type==='2') { // DEVIDE_TOKEN
			tokenname = false;
			nofdevtoken = false;
		}
		switch (when) {
			case '2': // BY_COMPLETION_OF_TASK
				taskname = false;
				break;
			case '3': // BY_NUMBER_OF_OWNED
				tokenname = false;
				reftoken = false;
				break;
			case '5': // BY_DATE
				term = false;
				break;
		}
		const btn = this.div.find('button.btn-search');
		btn.eq(0).prop('disabled', tokenname);
		btn.eq(1).prop('disabled', taskname);
		this.div.find('input[field="reftoken"]').prop('disabled', reftoken);
		this.div.find('#term').get(0).obj.disabled(term);
		const elm = this.div.find('input[field="rcalctype"]');
		elm.prop('disabled', nofdevtoken);
		if (nofdevtoken) {
			elm.parent().addClass('btn-disabled').removeClass('active');
		} else {
			elm.parent().removeClass('btn-disabled');
		}
		this.div.find('input[field="nofdevtoken"]').prop('disabled', nofdevtoken);
	},

	refresh : async function() {
		const btn = this.mkButton();
		let type = 0;
		let when = 0;
		const self = this;
		await Util.load(this.div, 'parts/token.html', this.mode, {
			button : btn,
			issuer : {
				click : () => {
					return true;
				}
			},
			type : {
				change : (evt) => {
					type = evt.target.value;
					self.grayAttr(type, when);
				}
			},
			when : {
				change : (evt) => {
					when = evt.target.value;
					self.grayAttr(type, when);
				}
			},
			attributes : [{
				click : () => {
				}
			},{
				click : () => {
				}
			}]

		});
		this.set(this.data);
	},

	create : async function() {
		const data = this.get();
		let ret = await Rpc.call(
			'token.add',
			[data]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		History.back();
	}

};

//# sourceURL=token.js
