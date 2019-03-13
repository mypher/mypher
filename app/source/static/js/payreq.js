// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

class PayReq {
	constructor(d) {
		this.div = d.div;
		this.mode = d.mode;
		this.data = {
			proposer : d.proposer,
			proposal_name : d.proposal_name,
		};
		this.term = d.term;
	}

	async draw() {
		await this.current();
		await this.refresh();
	}

	async current() {
		try {
			if (this.data.proposer && this.data.proposal_name) {
				let ms = await Rpc.call(
					'multisig.get_tran_info',
					[{account : this.data.proposer, proposal_name : this.data.proposal_name}]
				);
				this.data.approve_payment = ms.approved;
				const expiration = new Date(ms.expiration);
				this.data.expiration = [
					expiration.toLocaleDateString(),
					expiration.toLocaleTimeString(),
				].join(' ');
				if (ms.transaction[0]&&ms.transaction[0].data) {
					const data = ms.transaction[0].data;
					this.data.recipient = data.to;
					this.data.quantity = data.quantity;
					this.data.payer = data.from;
					this.data.memo = data.memo;
				} else {
					this.data.payer = '';
					this.data.recipient = '';
					this.data.quantity = '';
					this.data.memo = '';
				}
				if (this.data.payer) {
					ms = await Rpc.call('multisig.search', [{id:this.data.payer}]);
					this.data.eos_approvers = ms.coowner;
					this.data.nof_eos_approvers = ms.threshold;
				}
			}
		} catch (e) {
			UI.alert(e);
		}
	}

	async refresh() {
		const button = await this.initButtons();
		const userevt = {
			click : key => {
				let user = new User({
					div : $('#main'),
					name : key 
				});
				History.run(_L('USER'), user);
			},
			change : elm => {
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
			},

		};
		await Util.load(this.div, 'parts/payreq.html', this.mode, {
			button,
			approve_payment : userevt,
			eos_approvers : userevt, 
		});
		Util.setData(this.div, this.data);
	}

	async initButtons() {
		const btns = [];
		const type = await this.getType();
		if (type.canApprove) {
			btns.push({
				text : 'SIGN_TO_PAYMENT_REQ',
				click : () => {
					this.sign();
				}
			});
		}
		if (type.canReqPay&&type.recipient) {
			btns.push({
				text : 'GET_PAID',
				click : () => {
					this.get_paid();
				}
			});
		}
		btns.push({
			text : 'BACK',
			click : () => {
				this.term();
			}
		});
		return btns;
	}

	async getType() {
		const d = this.data;
		const approver = d.eos_approvers.includes(Account.user);
		const approved = d.approve_payment.includes(Account.user);

		return {
			recipient : (Account.user===d.recipient),
			canApprove : approver&&!approved,
			canReqPay : d.approve_payment.length>=d.nof_eos_approvers,
		};
	}

	async sign() {
		try {
			await Rpc.call(
				'multisig.sign',
				[{
					sender : Account.user,
					proposer : this.data.recipient,
					proposal_name : this.data.proposal_name
				}]
			);
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async get_paid() {
		try {
			await Rpc.call(
				'multisig.exec',
				[{
					sender : Account.user,
					proposal_name : this.data.proposal_name,
				}]
			);
			UI.alert('SUCCESS_TO_GET_PAID');
			this.draw();
		} catch (e) {
			UI.alert(e);
		}
		this.draw();
	}
}

//# sourceURL=payreq.js
