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
		$('div[field="pic"]').get(0).obj.allowedit(false);
		$('div[field="approve_task"]').get(0).obj.allowedit(false);
		$('div[field="approve_pic"]').get(0).obj.allowedit(false);
		$('div[field="approve_results"]').get(0).obj.allowedit(false);
	},

	set : async function(data) {
		this.data = data;
		Util.setData(this.div, this.data);
		await this.setenablestate();
		const drawDesc = o => {
			v = {
				description : o.description
			};
			Object.assign(this.data, v);
			Util.setData(this.div, v);
		};
		Rpc.call(
			'task.get_desc',
			[{hash:this.data.hash}]
		).then(info => {
			drawDesc(info);
		}).catch(e => {
			drawDesc({});
		});
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
					text : 'CANCEL_APPROVE_RESULTS',
					click : () => {
						this.cancel_approve_results();
					}
				});
			}
			if (vali.canApplyForPIC(this.data)) {
				btns.push({
					text : 'APPLY_FOR_PIC',
					click : () => {
						this.apply_for_pic();
					}
				});
			}
			if (vali.canCancelApplyForPIC(this.data)) {
				btns.push({
					text : 'CANCEL_APPLY_FOR_PIC',
					click : () => {
						this.cancel_apply_for_pic();
					}
				});
			}
			if (vali.canEdit(this.data)) {
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
		this.draw();
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
		this.draw();
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
		this.draw();
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
		this.draw();
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
		this.draw();
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
		this.draw();
	},
	apply_for_pic : async function() {
		const ret = await Rpc.call(
			'task.apply_for_pic',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
	},
	cancel_apply_for_pic : async function() {
		const ret = await Rpc.call(
			'task.cancel_apply_for_pic',
			[{
				sender : Account.user,
				id : this.data.id,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
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
	canEdit : function(data) {
		if (data.owner!==Account.user) {
			return false;
		}
		// if results already fulfill approval requiments, approval can't be canceled
		if (this.isFulfillApprovalReqForResults(data)) {
			return false;
		}
		return true;
	},
	canApproveTask : function(data) {
		// check if user is approver or pic
		if (!data.approvers.includes(Account.user)) {
			if (!data.pic.includes(Account.user)) {
				return false;
			}
			// only approved pic can approves the task
			if (!this.isFulfillApprovalReqForPIC(data)) {
				return false;
			}
		}
		// check if user approved the task
		if (data.approve_task.includes(Account.user)) {
			return false;
		}
		// if results already fulfill approval requiments, approval can't be canceled
		if (this.isFulfillApprovalReqForResults(data)) {
			return false;
		}
		return true;
	},
	canCancelApproveTask : function(data) {
		// check if user approved the task
		if (!data.approve_task.includes(Account.user)) {
			return false;
		}
		// if task already fulfills approval requiments, only pic can cancels
		if (this.isFulfillApprovalReqForTask(data)) {
			if (!data.pic.includes(Account.user)) {
				return false;
			}
		}
		// if results already fulfill approval requiments, approval can't be canceled
		if (this.isFulfillApprovalReqForResults(data)) {
			return false;
		}
		return true;
	},
	canApprovePIC : function(data) {
		// check if user is approver
		if (!data.approvers.includes(Account.user)) {
			return false;
		}
		// check if pic is set
		if (data.pic.length===0) {
			return false;
		}
		// check if user approved pic
		if (data.approve_pic.includes(Account.user)) {
			return false;
		}
		// if results already fulfill approval requiments, approval can't be canceled
		if (this.isFulfillApprovalReqForResults(data)) {
			return false;
		}
		return true;
	},
	canCancelApprovePIC : function(data) {
		// check if user approved pic
		if (!data.approve_pic.includes(Account.user)) {
			return false;
		}
		// check if results is approved
		if (!data.approve_results>0) {
			return false;
		}
		// if results already fulfill approval requiments, approval can't be canceled
		if (this.isFulfillApprovalReqForResults(data)) {
			return false;
		}
		return true;
	},
	canApproveResults : function(data) {
		// check if user is approver
		if (!data.approvers.includes(Account.user)) {
			return false;
		}
		// if task doesn't fulfill approval requiments, results can't be approved
		if (!this.isFulfillApprovalReqForTask(data)) {
			return false;
		}
		// if pic doesn't fulfill approval resuiments, results can't be approved
		if (!this.isFulfillApprovalReqForPIC(data)) {
			return false;
		}
		// if user already approved results, user can't approve results
		if (data.approve_results.includes(Account.user)) {
			return false;
		}
		return true;
	},
	canCancelApproveResults : function(data) {
		// check if user approved results
		if (!data.approve_results.includes(Account.user)) {
			return false;
		}
		// if results already fulfill approval requiments, approval can't be canceled
		if (this.isFulfillApprovalReqForResults(data)) {
			return false;
		}
		// if user doesn't approve results, user can't cancel approval for results
		if (!data.approve_results.includes(Account.user)) {
			return false;
		}
		return true;
	},
	canApplyForPIC : function(data) {
		// if pic is already set, user can't apply for pic
		if (data.pic.length>0) return false;
		return true;
	},
	canCancelApplyForPIC : function(data) {
		// if user isn't pic, user can't cancel
		if (!data.pic.includes(Account.user)) return false;
		// if results is on review process, user can't cancel
		if (data.approve_results.length>0) return false;
		return true;
	},
	isFulfillApprovalReqForTask : function(data) {
		// check if task fulfills own approval requirements and all pic approved it
		let nofapprove = 0, nofpic = 0;
		data.approvers.forEach(v => {
			if (data.approve_task.includes(v)) nofapprove++;
		});
		data.pic.forEach(v => {
			if (data.approve_task.includes(v)) nofpic++;
		});
		return ((nofapprove>=data.nofauth) && (data.pic.length===nofpic));
	},
	isFulfillApprovalReqForPIC : function(data) {
		// check if task fulfills approval requirements for pic
		let nofapprove = 0;
		data.approvers.forEach(v => {
			if (data.approve_pic.includes(v)) nofapprove++;
		});
		return (nofapprove>=data.nofauth);
	},
	isFulfillApprovalReqForResults : function(data) {
		// check if task fulfills approval requirements for results
		let nofapprove = 0;
		data.approvers.forEach(v => {
			if (data.approve_results.includes(v)) nofapprove++;
		});
		return (nofapprove>=data.nofauth);
	},
};

//# sourceURL=task.js
