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
		const info = await Rpc.call(
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
			if (this.canedit()) {
				btns.push({
					text : 'EDIT',
					click : () => {
						this.mode = MODE.EDIT;
						this.refresh();
					}
				});
			}
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
		const task = this.div.find('div[field="taskid"]').get(0).obj;
		const token = this.div.find('div[field="tokenid"]').get(0).obj;
		if (this.mode===MODE.REF) {
			task.allowedit(false);
			token.allowedit(false);
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
			task.disabled(taskname);
			token.disabled(tokenname);
			this.div.find('input[field="reftoken"]').prop('disabled', reftoken);
			this.div.find('#term').get(0).obj.disabled(term);
			const elm = this.div.find('div[field="rcalctype"]');
			elm.get(0).obj.enable(!nofdevtoken);
			this.div.find('input[field="nofdevtoken"]').prop('disabled', nofdevtoken);
		}
	},

	refresh : async function() {
		const btn = this.mkButton();
		let init = true;
		await Util.load(this.div, 'parts/token.html', this.mode, {
			issuertype : {
				change : v => {
					const issuer = this.div.find('input[field="issuer"]');
					if (parseInt(v)===1) {
						issuer.val(Account.user).prop('disabled', true);
					} else {
						issuer.val('').prop('disabled', false);
					}
				}
			},
			button : btn,
			issuer : {
				click : () => {
					return true;
				}
			},
			type : {
				change : evt => {
					const when = $('[field="when"]').val();
					if (!init) this.grayAttr(evt.target.value, when);
				}
			},
			when : {
				change : evt => {
					const type = $('[field="type"]').val();
					if (!init) this.grayAttr(type, evt.target.value);
				}
			},
			attributes : [{
				click : () => {
				}
			},{
				click : () => {
				}
			}],
			task : {
				click : () => {
					return true;
				},
				change : elm => {
					Rpc.call('task.list_byname', [elm.input.val()])
					.then(ret => {
						let l = [];
						ret.forEach(v => {
							l.push({
								key : v.id,
								name : v.name + '（' + v.id + '）'
							});
						});
						elm.obj.pulldown(l);
					});
				},
				name : async l => {
					l = await Rpc.call('task.getname', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.id,
							name : v.name + '（' + v.id + '）'
						});
					});
				}
			},
			token : {
				click : () => {
					return true;
				},
				change : elm => {
					Rpc.call('token.list_byname', [elm.input.val()])
					.then(ret => {
						let l = [];
						ret.forEach(v => {
							l.push({
								key : v.id,
								name : v.name + '（' + v.id + '）'
							});
						});
						elm.obj.pulldown(l);
					});
				},
				name : async l => {
					l = await Rpc.call('token.getname', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.id,
							name : v.name + '（' + v.id + '）'
						});
					});
				}
			}
		});
		init = false;
		this.set(this.data);
	},

	create : async function() {
		const data = this.get();
		data.sender = Account.user;
		const ret = await Rpc.call(
			'token.add',
			[data]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		History.back();
	},

	commit : async function() {
		const data = this.get();
		data.sender = Account.user;
		let ret = await Rpc.call(
			'token.update',
			[data]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.mode = MODE.REF;
		this.refresh();
	},

	canedit : function() {
		if (Number(this.data.issuertype)===0) { // cipher
			return false;
		} else { // individual
			return (Account.user===this.data.issuer);
		}
	}

};

//# sourceURL=token.js
