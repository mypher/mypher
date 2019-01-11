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
			tokenid : d.tokenid,
			cdraftid : d.cdraftid,
			issuer : d.cipherid,
		}
	}

	get() {
		this.data = Util.getData(this.div, {});
		return this.data;
	}

	async set(data) {
		this.data = data;
		const owner = $('div[name="issuer"]');
		if (data.issuer2==='') {
			owner.show();
		} else {
			owner.hide();
		}
		Util.setData(this.div, this.data);
		this.grayAttr(this.data.type, this.data.when);
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
			[{tokenid:this.data.tokenid}]
		);
		if (info.code!==undefined) {
			UI.alert(info.code);
			return;
		}
		/*if (this.cdata.id) {
			const cinfo = await Rpc.call(
				'cipher.get',
				[{id:this.cdata.id}]
			);
			if (cinfo.code!==undefined) {
				UI.alert(info.code);
				return;
			}
			this.cdata = cinfo.data;
		}*/
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
		let nofdesttoken = true;
		let nofdesteos = true;
		if (Number(type)===2) { // DEVIDE_TOKEN
			tokenname = false;
			nofdesttoken = false;
		}
		if (Number(type)===3) { // DEVIDE_EOS
			nofdesteos = false;
		}
		switch (Number(when)) {
			case 1: // BY_COMPLETION_OF_TASK
				taskname = false;
				break;
			case 2: // BY_NUMBER_OF_OWNED
				tokenname = false;
				reftoken = false;
				break;
		}
		const task = this.div.find('div[field="taskid"]').get(0).obj;
		const token = this.div.find('div[field="extokenid"]').get(0).obj;
		if (this.mode===MODE.REF) {
			task.allowedit(false);
			token.allowedit(false);
			this.div.find('input[field="reftoken"]').prop('disabled', true);
			const elm = this.div.find('div[field="rcalctype"]');
			if (nofdesttoken) {
				elm.get(0).obj.enable(false);
			} else {
				const obj = elm.get(0).obj;
				obj.enable(true);
				obj.allowedit(false);
			}
			this.div.find('input[field="nofdesttoken"]').prop('disabled', true);
			this.div.find('input[field="nofdesteos"]').prop('disabled', true);
		} else {
			task.disabled(taskname);
			token.disabled(tokenname);
			this.div.find('input[field="reftoken"]').prop('disabled', reftoken);
			const elm = this.div.find('div[field="rcalctype"]');
			elm.get(0).obj.enable(!nofdesttoken);
			this.div.find('input[field="nofdesttoken"]').prop('disabled', nofdesttoken);
			this.div.find('input[field="nofdesteos"]').prop('disabled', nofdesteos);
		}
	}

	async refresh() {
		const btn = this.initButton();
		let init = true;
		await Util.load(this.div, 'parts/token.html', this.mode, {
			button : btn,
			issuer : {
				click : key => {
					const cipher = new Cipher({
						div : $('#main'),
						cipherid : key,
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
							key : v.cipherid,
							name : v.name + '（' + v.cipherid + '）'
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
								key : v.tformalid,
								name : v.name + '（' + v.tformalid + '）'
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
							key : v.tformalid,
							name : v.name + '（' + v.tformalid + '）'
						});
					});
					return ret;
				}
			},
			token : {
				click : key => {
					const token = new Token({
						div : $('#main'),
						tokenid : key,
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
								key : v.tokenid,
								name : v.name + '（' + v.tokenid + '）'
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
							key : v.tokenid,
							name : v.name + '（' + v.tokenid + '）'
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
		// cdraftid
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
		let ret = await Rpc.call(
			'token.update',
			[data]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.mode = MODE.REF;
		this.draw();
	}

};

Token.prototype.Validator = {
	canEdit : function() {
		const self = this.parent;
		return self.cdata.editors&&self.cdata.editors.includes(Account.user);
	}
}

//# sourceURL=token.js
