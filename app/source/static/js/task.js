// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function Task(d) {
	this.div = d.div;
	this.mode = d.mode;
	this.data = {
		id : d.id,
		cipherid : d.cipherid||'',
		owner : d.cipherid ? '' : Account.user
	};
}

Task.prototype = {
	get : function() {
		this.data = Util.getData(this.div, {
			formal:this.data.formal||true
		});
		if (!this.data.cipherid) {
			this.data.formal = true;
		}
		// TODO:if data is owned by cipher, property:formal is set to cipher's state.
		return this.data;
	},

	set : async function(data) {
		this.data = data;
		const cipher = $('div[name="cipherid"]');
		const owner = $('div[name="owner"]');
		if (data.cipherid==='') {
			cipher.hide();
			owner.show();
		} else {
			cipher.show();
			owner.hide();
		}
		Util.setData(this.div, this.data);
		cipher.find('div[field]').get(0).obj.allowedit(false);
		owner.find('div[field]').get(0).obj.allowedit(false);
	},

	draw : async function() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		}
		await this.refresh();
	},

	save : async function() {
	},

	current : async function() {
		const info = await Rpc.call(
			'task.get',
			[{id:this.data.id}]
		);
		if (info.code!==undefined) {
			UI.alert(info.code);
			return;
		}
		this.data = info;
	},

	initButtons : function() {
		let btns = [];
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
			if (this.data.owner===Account.user) {
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

	refresh : async function() {
		const btns = this.initButtons()
		await Util.load(this.div, 'parts/task.html', this.mode, {
			cipherid : {
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
			owner : {
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
			tags : [{
				click : () => {
				}
			}],
			rule : [{
				click : () => {
				}
			},{
				click : () => {
				}
			}],
			rewardid : {
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
			},
			pic : {
				click : key => {
					let user = new User({
						div : $('#main'),
						name : key 
					});
					History.run(_L('USER'), user);
				},
				change : elm => {
					Rpc.call('person.list_byname', [elm.input.val()])
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
			button : btns
		});
		this.set(this.data);
	},

	create : async function() {
		const data = this.get();
		data.sender = Account.user;
		const ret = await Rpc.call(
			'task.add',
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
			'task.update',
			[data]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.mode = MODE.REF;
		this.refresh();
	},


};

//# sourceURL=task.js
