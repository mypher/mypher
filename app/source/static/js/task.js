// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function Task(d) {
	this.div = d.div;
	this.mode = d.mode;
	this.data = {
		id : d.id,
		cipherid : d.cipherid,
		owner : Account.user
	};
}

Task.prototype = {
	get : function() {
		this.data = Util.getData(this.div, {
			cipherid:this.data.cipherid||'',
			formal:this.data.foral||true
		});
		if (!this.data.cipherid) {
			this.data.formal = true;
		}
		// TODO:if data is owned by cipher, property:formal is set to cipher's state.
		return this.data;
	},

	set : async function(data) {
		this.data = data;
		Util.setData(this.div, this.data);
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
			reward : [{
				click : () => {
				}
			}],
			pic : {
				click : () => {
					return true;
				},
				change : elm => {
					Rpc.call('person.listbyname', [elm.input.val()])
					.then(ret => {
						elm.obj.pulldown(ret);
					});
				},
				name : async l => {
					return await Rpc.call('person.getname', [l]);
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
