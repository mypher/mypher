// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

class Task {
	constructor(d) {
		this.div = d.div;
		this.mode = d.mode;
		this.data = {
			id : d.id,
			cipherid : (d.cipherid!==undefined) ? d.cipherid : '',
			cdraftid : (d.cdraftid!==undefined) ? d.cdraftid : '',
			tdraftid : (d.tdraftid!==undefined) ? d.tdraftid : '',
		};
		this.editors = d.editors;
	}

	get() {
		this.data = Util.getData(this.div, {
			cipherid : this.data.cipherid,
			cdraftid : this.data.cdraftid,
		});
		return this.data;
	}

	async set(data) {
		this.data = data;
		Util.setData(this.div, this.data);
		const cipher = $('div[name="cipherid"]');
		cipher.find('div[field]').get(0).obj.allowedit(false);
		$('div[field="pic"]').get(0).obj.allowedit(false);
		$('div[field="approve_pic"]').get(0).obj.allowedit(false);
		$('div[field="approve_results"]').get(0).obj.allowedit(false);
		const drawDesc = o => {
			const v = {
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
	}

	async draw() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		}
		await this.refresh();
	}

	async save() {
	}

	async current() {
		const info = await Rpc.call(
			'task.get',
			[{
				cipherid:this.data.cipherid,
				tdraftid:this.data.tdraftid,
			}]
		);
		if (info.code!==undefined) {
			UI.alert(info.code);
			return;
		}
		const cipherid = this.data.cipherid;
		this.data = info.tdraft;
		this.data.cipherid = cipherid;
		if (info.tformal) {
			const d = info.tformal;
			this.data.tformalid = d.tformalid;
			this.data.approve_pic = d.approve_pic;
			this.data.approve_results = d.approve_results;
		} else {
			this.data.tformalid = undefined;
			this.data.approve_pic = [];
			this.data.approve_results = [];
		}
	}

	initButtons() {
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
			if (vali.canEdit(this.data, this.editors)) {
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

	async refresh() {
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
							key : v.personid,
							name : v.name + '（' + v.personid + '）'
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
						key : v.personid,
						name : v.name + '（' + v.personid + '）'
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
			tags : [{
				click : () => {
				}
			}],
			rewardid : {
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
			},
			approvers : userevt,
			pic : userevt,
			approve_pic : userevt,
			approve_results : userevt,
			button : btns
		});
		this.set(this.data);
	}

	async create() {
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
	}

	async commit() {
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
		this.data.tdraftid = ret;
		this.draw();
	}

	async approve_pic() {
		const ret = await Rpc.call(
			'task.approve_pic',
			[{
				sender : Account.user,
				tformalid : this.data.tformalid,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
	}

	async cancel_approve_pic() {
		const ret = await Rpc.call(
			'task.cancel_approve_pic',
			[{
				sender : Account.user,
				tformalid : this.data.tformalid,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
	}

	async approve_results() {
		const ret = await Rpc.call(
			'task.approve_results',
			[{
				sender : Account.user,
				tformalid : this.data.tformalid,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
	}

	async cancel_approve_results() {
		const ret = await Rpc.call(
			'task.cancel_approve_results',
			[{
				sender : Account.user,
				tformalid : this.data.tformalid,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
	}

	async apply_for_pic() {
		const ret = await Rpc.call(
			'task.apply_for_pic',
			[{
				sender : Account.user,
				tformalid : this.data.tformalid,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
	}

	async cancel_apply_for_pic() {
		const ret = await Rpc.call(
			'task.cancel_apply_for_pic',
			[{
				sender : Account.user,
				tformalid : this.data.tformalid,
			}]
		);
		if (ret.code!==undefined) {
			UI.alert(ret.code);
			return;
		}
		this.draw();
	}
};

Task.prototype.Validator = {
	canEdit : function(data, editors) {
		if(!editors.includes(Account.user)) {
			return false;
		}
		// if results already fulfill approval requiments, approval can't be canceled
		if (this.isFulfillApprovalReqForResults(data)) {
			return false;
		}
		return true;
	},
	canApprovePIC : function(data) {
		// if login user does not fulfills both of following requiments, can not approve the pic
		// - the user is the approver
		// - the user is the pic
		if (!data.approvers.includes(Account.user) && !data.pic.includes(Account.user)) {
			return false;
		}
		// check if pic is set
		if (data.pic.length===0) {
			return false;
		}
		// check if the user already approved pic
		if (data.approve_pic.includes(Account.user)) {
			return false;
		}
		// if results already fulfill the approval requiments, approval can't be canceled
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
		// check if the data fulfills all of following requirements 
		// - the number of approvals for pic equals or overs the requirements
		// - login user is not the pic
		if (this.isFulfillApprovalReqForPIC(data) && !data.pic.includes(Account.user)) {
			return false;
		}
		// if the approval for results is completely done, the approval for PIC can't be canceled
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
		// the task is not formalized can not be applied
		if (data.tformalid===undefined) return false;
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
	isFulfillApprovalReqForPIC : function(data) {
		// check if the pic of the task is approved by all approvers and pic themselves 
		let nofapprove = 0, nofpic = 0;
		data.approvers.forEach(v => {
			if (data.approve_pic.includes(v)) nofapprove++;
		});
		data.pic.forEach(v => {
			if (data.approve_pic.includes(v)) nofpic++;
		});
		return ((nofapprove>=parseInt(data.nofapproval)) && (data.pic.length===nofpic));
	},
	isFulfillApprovalReqForResults : function(data) {
		// check if task fulfills approval requirements for results
		let nofapprove = 0;
		data.approvers.forEach(v => {
			if (data.approve_results.includes(v)) nofapprove++;
		});
		return (nofapprove>=parseInt(data.nofapproval));
	},
};

//# sourceURL=task.js
