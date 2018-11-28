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

	setenablestate : async function() {
		const cipher = $('div[name="cipherid"]');
		const owner = $('div[name="owner"]');
		if (this.data.cipherid==='') {
			cipher.hide();
			owner.show();
		} else {
			cipher.show();
			owner.hide();
		}
		cipher.find('div[field]').get(0).obj.allowedit(false);
		owner.find('div[field]').get(0).obj.allowedit(false);
		const vali = this.Validator;
		if (this.mode !== MODE.REF) {
			$('div[field="pic"]').get(0).obj.allowedit(vali.canSetPIC(this.data));
		}
		$('div[field="approve_task"]').get(0).obj.allowedit(false);
		$('div[field="approve_pic"]').get(0).obj.allowedit(false);
		$('div[field="approve_results"]').get(0).obj.allowedit(false);
	},

	set : async function(data) {
		this.data = data;
		Util.setData(this.div, this.data);
		await this.setenablestate();
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
		const vali = this.Validator;
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
			if (vali.canApproveTask(this.data)) {
				btns.push({
					text : 'APPROVE_TASK',
					click : () => {
						this.approve_task();
					}
				});
			}
			if (vali.canCancelApproveTask(this.data)) {
				btns.push({
					text : 'CANCEL_APPROVE_TASK',
					click : () => {
						this.cancel_approve_task();
					}
				});
			}
			if (vali.canApprovePIC(this.data)) {
				btns.push({
					text : 'APPROVE_PIC',
					click : () => {
						this.approve_pic();
					}
				});
			}
			if (vali.canCancelApprovePIC(this.data)) {
				btns.push({
					text : 'CANCEL_APPROVE_PIC',
					click : () => {
						this.cancel_approve_pic();
					}
				});
			}
			if (vali.canApproveResults(this.data)) {
				btns.push({
					text : 'APPROVE_RESULTS',
					click : () => {
						this.approve_results();
					}
				});
			}
			if (vali.canCancelApproveResults(this.data)) {
				btns.push({
					text : 'CANCEL_APPROVE_TASK',
					click : () => {
						this.cancel_approve_task();
					}
				});
			}
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
		const userevt = {
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
		};
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
			owner : userevt,
			tags : [{
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
			approvers : userevt,
			pic : userevt,
			approve_task : userevt,
			approve_pic : userevt,
			approve_results : userevt,
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

	approve_task : async function() {
		const ret = await Rpc.call(
			'task.approve_task',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.refresh();
	},
	cancel_approve_task : async function() {
		const ret = await Rpc.call(
			'task.cancel_approve_task',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.refresh();
	},
	approve_pic : async function() {
		const ret = await Rpc.call(
			'task.approve_pic',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.refresh();
	},
	cancel_approve_pic : async function() {
		const ret = await Rpc.call(
			'task.cancel_approve_pic',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.refresh();
	},
	approve_results : async function() {
		const ret = await Rpc.call(
			'task.approve_results',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.refresh();
	},
	cancel_approve_results : async function() {
		const ret = await Rpc.call(
			'task.cancel_approve_results',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.refresh();
	},
};

Task.prototype.Validator = {
	NOT_AUTH_TASK : 0,
	NOT_SET_PIC : 1,
	NOT_AUTH_PIC : 2,
	NOT_AUTH_RESULTS : 3,
	DONE : 4,
	getstate : async function(data) {
		const isfulfill = l => {
			if (!data.approvers||data.approvers.length===0) return false;z
			const nofauth = data.approvers.filter(function (x, i, self) {
				return self.indexOf(x) === i;
			});
			let req = data.nofauth;
			nofauth.forEach(v => {
				if (l.includes(v)) req--;
			});
			return (req<=0);
		};
		// check if task is authorized
		if (data.ciphreid) {
			const cipher = await Rpc.call(
				'cipher.get',
				[data.cipherid]
			);
			if (!cipher.data.formal) return this.NOT_AUTH_TASK;
		} else {
			if (!isfulfill(data.approve_pic)) return this.NOT_AUTH_TASK;
		}
		// check if pic is set
		if (data.pic.length===0) return this.NOT_SET_PIC;
		// check if pic is not authorized
		if (!isfulfill(data.approve_pic)) return this.NOT_AUTH_PIC;
		// check if results is not authorized
		if (!isfulfill(data.approve_pic)) return this.NOT_AUTH_RESULTS;
		return this.DONE;
	},
	canSetPIC : function(data) {
		if (!data.approve_task) return false;
		const state = this.getstate(data);
		return (data.approve_task.includes(Account.user)&&(state<this.NOT_AUTH_PIC));
	},
	canApproveTask : function(data) {
		return true;
	},
	canCancelApproveTask : function(data) {
		return true;
	},
	canApprovePIC : function(data) {
		return true;
	},
	canCancelApprovePIC : function(data) {
		return true;
	},
	canApproveResults : function(data) {
		return true;
	},
	canCancelApproveResults : function(data) {
		return true;
	},
};

//# sourceURL=task.js
