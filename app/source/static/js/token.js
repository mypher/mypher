// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

class Token extends View {

	constructor(d) {
		super();
		this.div = d.div;
		this.mode = d.mode;
		this.data = {
			id : d.id,
			issuer2 : d.cipherid||'',
			issuer : d.cipherid ? '' : Account.user
		}
		this.cdata = {
			id : d.cid
		};
	}

	get() {
		this.data = Util.getData(this.div, {});
		return this.data;
	}

	async set(data) {
		this.data = data;
		const cipher = $('div[name="issuer2"]');
		const owner = $('div[name="issuer"]');
		if (data.issuer2==='') {
			cipher.hide();
			owner.show();
		} else {
			cipher.show();
			owner.hide();
		}
		Util.setData(this.div, this.data);
		this.grayAttr(this.data.type, this.data.when);
		cipher.find('div[field]').get(0).obj.allowedit(false);
		owner.find('div[field]').get(0).obj.allowedit(false);
	}

	async save() {
	}

	async draw() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		} else {
			this.data.type = 0;
			this.data.when = 0;
		}
		await this.refresh();
	}

	async current() {
		const info = await Rpc.call(
			'token.get',
			[{id:this.data.id}]
		);
		if (info.code!==undefined) {
			UI.alert(info.code);
			return;
		}
		if (this.cdata.id) {
			const cinfo = await Rpc.call(
				'cipher.get',
				[{id:this.cdata.id}]
			);
			if (cinfo.code!==undefined) {
				UI.alert(info.code);
				return;
			}
			this.cdata = cinfo.data;
		}
		this.data = info;
	}

	initButton() {
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
			if (this.Validator.canEdit()) {
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
	}

	async grayAttr(type, when) {
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
	}

	async refresh() {
		const btn = this.initButton();
		let init = true;
		await Util.load(this.div, 'parts/token.html', this.mode, {
			button : btn,
			issuer2 : {
				click : key => {
					const cipher = new Cipher({
						div : $('#main'),
						id : key,
						mode : MODE.REF
					});
					History.run(_L('CIPHER'), cipher);
				},
				change : elm => {
				},
				name : async l => {
					l = await Rpc.call('cipher.name', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.id,
							name : v.name + '（' + v.id + '）'
						});
					});
					return ret;
				}
			},
			issuer : {
				click : key => {
					const task = new Task({
						div : $('#main'),
						id : key,
						mode : MODE.REF
					});
					History.run(_L('TASK'), task);
				},
				change : elm => {
				},
				name : async l => {
					l = await Rpc.call('person.name', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.id,
							name : v.name + '（' + v.id + '）'
						});
					});
					return ret;
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
				click : key => {
					const task = new Task({
						div : $('#main'),
						id : key,
						mode : MODE.REF
					});
					History.run(_L('TASK'), task);
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
					l = await Rpc.call('task.name', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.id,
							name : v.name + '（' + v.id + '）'
						});
					});
					return ret;
				}
			},
			token : {
				click : key => {
					const token = new Token({
						div : $('#main'),
						id : key,
						mode : MODE.REF
					});
					History.run(_L('TOKEN'), token);
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
					l = await Rpc.call('token.name', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.id,
							name : v.name + '（' + v.id + '）'
						});
					});
					return ret;
				}
			}
		});
		init = false;
		this.set(this.data);
	}

	async create() {
		const data = this.get();
		data.sender = Account.user;
		data.cid = this.cdata.id;
		const ret = await Rpc.call(
			'token.add',
			[data]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		History.back();
	}

	async commit() {
		const data = this.get();
		data.sender = Account.user;
		data.cid = this.cdata.id;
		let ret = await Rpc.call(
			'token.update',
			[data]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.mode = MODE.REF;
		this.data.id = ret;
		this.draw();
	}

};

Token.prototype.Validator = {
	canEdit : function() {
		const self = this.parent;
		if (self.data.issuer2) { // cipher
			return self.cdata.editors&&self.cdata.editors.includes(Account.user);
		} else { // individual
			return (Account.user===self.data.issuer);
		}
	}
}

//# sourceURL=token.js
