// Copyright (C) 2018-2019 The Mypher Authors
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
			editors : (d.editors!==undefined) ? d.editors : '',
		};
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
		try {
			[ 
				$('h2[ltext="RULE_OF_PAYMENT"]'),
				$('div[name="multisig"]'),
				$('div[name="rop_footer"]'),
			].forEach(elm => {
				if (data.multisig) {
					elm.show();
				} else {
					elm.hide();
				}
			});
		} catch (e){}
		Util.setData(this.div, this.data);
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
			UI.alert(e);
			drawDesc({});
		});
	}

	async draw() {
		await this.current();
		await this.refresh();
	}

	async save() {
	}

	async current() {
		try {
			if (this.mode!==MODE.NEW) {
				const info = await Rpc.call(
					'task.get',
					[{
						cipherid:this.data.cipherid,
						tdraftid:this.data.tdraftid,
					}]
				);
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
			const d = await Rpc.call('cipher.get', [{cipherid:this.data.cipherid}]);
			this.data.cipher = d.name;
			this.data.editors = d.editors;
			this.data.multisig = d.multisig;
			this.data.formalver = d.formalver;
			this.data.version = d.version;
			if (d.multisig) {
				const ms = await Rpc.call('multisig.search', [{id:d.multisig}]);
				this.data.eos_approvers = ms.coowner;
				this.data.nof_eos_approvers = ms.threshold;
			}
		} catch (e) {
			UI.alert(e);
		}
	}

	async initButtons() {
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
		{
			const auth = vali.getUserAuth(this.data);
			const stat = await vali.getStat(this.data);
			// if loginuser is editor of the cipher to which this task belongs
			if (auth.editors) {
				if (stat===vali.STAT.DRAFT) {
					btns.push({
						text : 'EDIT',
						click : () => {
							this.mode = MODE.EDIT;
							this.refresh();
						}
					});
				}
			}
			// if loginuser is approver of this task
			if (auth.approvers) {
				if (stat===vali.STAT.APPROVAL) {
					btns.push({
						text : 'APPROVE_PIC',
						click : () => {
							this.approve_pic();
						}
					});
					btns.push({
						text : 'CANCEL_APPROVE_PIC',
						click : () => {
							this.cancel_approve_pic();
						}
					});
				}
				if (stat===vali.STAT.REVIEW) {
					btns.push({
						text : 'APPROVE_RESULTS',
						click : () => {
							this.approve_results();
						}
					});
					btns.push({
						text : 'CANCEL_APPROVE_RESULTS',
						click : () => {
							this.cancel_approve_results();
						}
					});
				}
			}
			// if loginuser is coowner of multisig account
			if (auth.coowner) {
				if (stat===vali.STAT.SIGN) {
					btns.push({
						text : 'SIGN_TO_PAYMENT_REQ',
						click : () => {
							this.sign();
						}
					});
				}
			}
			// if loginuser is P.I.C. of this task
			if (auth.pic) {
				if (stat===vali.STAT.RECRUITMENT) {
					btns.push({
						text : 'APPLY_FOR_PIC',
							click : () => {
							this.apply_for_pic();
						}
					});
				}
				if (stat===vali.STAT.APPROVAL) {
					btns.push({
						text : 'CANCEL_APPLY_FOR_PIC',
						click : () => {
							this.cancel_apply_for_pic();
						}
					});
					btns.push({
						text : 'APPROVE_PIC',
						click : () => {
							this.approve_pic();
						}
					});
					btns.push({
						text : 'CANCEL_APPROVE_PIC',
						click : () => {
							this.cancel_approve_pic();
						}
					});
				}
				if (stat===vali.STAT.INPROGRESS) {
					btns.push({
						text : 'CANCEL_APPLY_FOR_PIC',
						click : () => {
							this.cancel_apply_for_pic();
						}
					});
					btns.push({
						text : 'PRESENT_RESULTS',
						click : () => {
							this.present_results();
						}
					});
				}
				if (stat===vali.STAT.REVIEW) {
					btns.push({
						text : 'CANCEL_PRESENTATION_OF_RESULTS',
						click : () => {
							this.cancel_present_results();
						}
					});
				}
				if (stat===vali.STAT.WAIT_PAYREQ) {
					btns.push({
						text : 'REQUEST_PAYMENT',
						click : () => {
							this.request_payment();
						}
					});
					btns.push({
						text : 'CANCEL_PRESENTATION_OF_RESULTS',
						click : () => {
							this.cancel_present_results();
						}
					});
				}
				if (stat===vali.STAT.SIGN) {
					btns.push({
						text : 'CANCEL_PAYMENT_REQUEST',
						click : () => {
							this.cancel_request_payment();
						}
					});
				}
				if (stat===vali.STAT.WAIT_PAY) {
					btns.push({
						text : 'GET_PAID',
						click : () => {
							this.get_paid();
						}
					});
				}
			}
			btns.push({
				text : 'BACK',
				click : () => {
					History.back();
				}
			});
		}
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
				}).catch(e => {
					UI.alert(e);
				});
			},
			name : async l => {
				try {
					l = await Rpc.call('person.name', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.personid,
							name : v.name + '（' + v.personid + '）'
						});
					});
					return ret;
				} catch (e) {
					UI.alert(e);
					return [];
				}
			}
		};
		const btns = await this.initButtons()
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
					try {
						l = await Rpc.call('cipher.name', [l]);
						let ret = [];
						l.forEach(v => {
							ret.push({
								key : v.cipherid,
								name : v.name + '（' + v.cipherid + '）'
							});
						});
						return ret;
					} catch (e) {
						UI.alert(e);
						return [];
					}
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
					}).catch(e => {
						UI.alert(e);
					});
				},
				name : async l => {
					try {
						l = await Rpc.call('token.name', [l]);
						let ret = [];
						l.forEach(v => {
							ret.push({
								key : v.tokenid,
								name : v.name + '（' + v.tokenid + '）'
							});
						});
						return ret;
					} catch(e) {
						UI.alert(e);
						return [];
					}
				}
			},
			approvers : userevt,
			pic : userevt,
			approve_pic : userevt,
			approve_results : userevt,
			eos_approvers : userevt,
			button : btns
		});
		this.set(this.data);
	}

	async create() {
		const data = this.get();
		data.sender = Account.user;
		try {
			await Rpc.call('task.add', [data]);
			History.back();
		} catch (e) {
			UI.alert(e);
		}
	}

	async commit() {
		try {
			const data = this.get();
			data.sender = Account.user;
			this.data.tdraftid = await Rpc.call(
				'task.update',
				[data]
			);
			this.mode = MODE.REF;
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async approve_pic() {
		try {
			await Rpc.call(
				'task.approve_pic',
				[{
					sender : Account.user,
					tformalid : this.data.tformalid,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async cancel_approve_pic() {
		try {
			await Rpc.call(
				'task.cancel_approve_pic',
				[{
					sender : Account.user,
					tformalid : this.data.tformalid,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async approve_results() {
		try {
			await Rpc.call(
				'task.approve_results',
				[{
					sender : Account.user,
					tformalid : this.data.tformalid,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async cancel_approve_results() {
		try {
			await Rpc.call(
				'task.cancel_approve_results',
				[{
					sender : Account.user,
					tformalid : this.data.tformalid,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async apply_for_pic() {
		try {
			await Rpc.call(
				'task.apply_for_pic',
				[{
					sender : Account.user,
					tformalid : this.data.tformalid,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async cancel_apply_for_pic() {
		try {
			await Rpc.call(
				'task.cancel_apply_for_pic',
				[{
					sender : Account.user,
					tformalid : this.data.tformalid,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async sign() {
		try {
			await Rpc.call(
				'multisig.sign',
				[{
					sender : Account.user,
					account : this.data.pic,
					name : this.data.payment
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async present_results() {
		try {
			const data = this.get();
			await Rpc.call(
				'task.present_results',
				[{
					sender : Account.user,
					tformalid : data.tformalid,
					results : data.results,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async cancel_present_results() {
		try {
			await Rpc.call(
				'task.cancel_present_results',
				[{
					sender : Account.user,
					tformalid : data.tformalid,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async request_payment() {
		try {
			const data = this.get();
			await Rpc.call(
				'task.request_payment',
				[{
					sender : Account.user,
					tformalid : data.tformalid,
					name : data.name,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async cancel_request_payment() {
		try {
			const data = this.get();
			await Rpc.call(
				'task.cancel_request_payment',
				[{
					sender : Account.user,
					name : data.name,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async get_paid() {
		try {
			const data = this.get();
			await Rpc.call(
				'multisig.execute',
				[{
					sender : Account.user,
					name : data.name,
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}
};

Task.prototype.Validator = {

	getUserAuth : function(data) {
		return {
			editors : data.editors.includes(Account.user),
			approvers : data.approvers.includes(Account.user),
			coowners : data.eos_approvers.includes(Account.user),
			pic : (data.pic.length===0) || data.pic.includes(Account.user),
		};
	},

	STAT : {
		DRAFT : 0,
		RECRUITMENT : 1,
		APPROVAL : 2,
		INPROGRESS : 3,
		REVIEW : 4,
		WAIT_PAYREQ : 5,
		SIGN : 6,
		WAIT_PAY : 7,
		COMPLETE : 8,
	},

	getStat : async function(data) {
		// results are already approved
		if (this.isFulfillApprovalReqForResults(data)) {
			if (this.isPayByCrypto(data)) {
				const stat = await this.getPaymentStat(data);
				return [
					this.STAT.COMPLETE,
					this.STAT.WAIT_PAYREQ,
					this.STAT.SIGN,
					this.STAT.WAIT_PAY,
					this.STAT.COMPLETE,
				][stat];
			} 
			return this.STAT.COMPLETE;
		}
		// already results is presented
		if (Util.isNotEmpty(data.results)) {
			return this.STAT.REVIEW;
		}
		// P.I.C. is already approved
		if (this.isFulfillApprovalReqForPIC(data)) {
			return this.STAT.INPROGRESS;
		}
		// Someone already applies for P.I.C. 
		if (data.pic.length>0) {
			return this.STAT.APPROVAL;
		}
		// cipher is formal version
		if (this.isEditable(data)) {
			return this.STAT.DRAFT;
		}
		return this.STAT.RECRUITMENT;
	},

	isEditable : function(data) {
		// only the case which version is bigger than latest formal version, a draft is editable
		if (data.formalver >= data.version) {
			return false;
		}
		return true;
	},

	isPayByCrypto : function(data) {
		let a = parseInt(data.amount);
		return IsNaN(a) ? false : ((a>0) ? true : false);
	},

	// 0 : not target
	// 1 : not requested yet
	// 2 : wait for signature
	// 3 : ready to pay
	// 4 : not exists in blockchain(already processed) or can't check payments status
	getPaymentStat : async function(data) {
		if (isEmpty(data.multisig)||!this.isPayByCrypto(data)) {
			return 0;
		}
		if (isEmpty(data.payment)) {
			return 1;
		}
		try {
			const info = await Rpc.call(
				'multisig.get_tran_info',
				[{
					account : data.pic,
					name : data.paymnet
				}]
			);
			// no longer exists in blockchain
			if (!info.id) {
				return 4;
			}
			// not fulfill requirements
			if (info.signed.length<this.data.nof_eos_approvers) {
				return 2;
			}
			return 3;
		} catch (e) {
			UI.alert(e);
		}
		return 4;
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
