// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function Token(d) {
	this.div = d.div;
	this.mode = d.mode;
	this.data = {id:d.id};
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
		let info = await Rpc.call(
			'token.get',
			[{id:this.data.id}]
		);
		if (info.code!==undefined) {
			UI.alert(info.code);
			return;
		}
		this.data = info;
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
		if (Number(type)===2) { // DEVIDE_TOKEN
			tokenname = false;
			nofdevtoken = false;
		}
		switch (Number(when)) {
			case 2: // BY_COMPLETION_OF_TASK
				taskname = false;
				break;
			case 3: // BY_NUMBER_OF_OWNED
				tokenname = false;
				reftoken = false;
				break;
			case 5: // BY_DATE
				term = false;
				break;
		}
		const btn = this.div.find('button.btn-search');
		if (this.mode===MODE.REF) {
			btn.eq(0).prop('disabled', true);
			btn.eq(1).prop('disabled', true);
			this.div.find('input[field="reftoken"]').prop('disabled', true);
			if (term) {
				this.div.find('#term').get(0).obj.disabled(true);
			} else {
				this.div.find('#term').get(0).obj.allowedit(false);
			}
			const elm = this.div.find('div[field="rcalctype"]');
			if (nofdevtoken) {
				elm.get(0).obj.enable(false);
			} else {
				const obj = elm.get(0).obj;
				obj.enable(true);
				obj.allowedit(false);;
			}
			this.div.find('input[field="nofdevtoken"]').prop('disabled', true);
		} else {
			btn.eq(0).prop('disabled', tokenname);
			btn.eq(1).prop('disabled', taskname);
			this.div.find('input[field="reftoken"]').prop('disabled', reftoken);
			this.div.find('#term').get(0).obj.disabled(term);
			const elm = this.div.find('div[field="rcalctype"]');
			elm.get(0).obj.enable(!nofdevtoken);
			this.div.find('input[field="nofdevtoken"]').prop('disabled', nofdevtoken);
		}
	},

	refresh : async function() {
		const btn = this.mkButton();
		const self = this;
		let init = true;
		await Util.load(this.div, 'parts/token.html', this.mode, {
			button : btn,
			issuer : {
				click : () => {
					return true;
				}
			},
			type : {
				change : (evt) => {
					const when = $('[field="when"]').val();
					if (!init) self.grayAttr(evt.target.value, when);
				}
			},
			when : {
				change : (evt) => {
					const type = $('[field="type"]').val();
					if (!init) self.grayAttr(type, evt.target.value);
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
		init = false;
		this.set(this.data);
	},

	create : async function() {
		const data = this.get();
		data.sender = Account.user;
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
