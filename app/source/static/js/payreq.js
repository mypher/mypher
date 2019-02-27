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
				if (ms.transaction[0]&&ms.transaction[0].data) {
					const data = ms.transaction[0].data;
					this.data.receipient = data.to;
					this.data.quantity = data.quantity;
					this.data.payer = data.from;
				} else {
					this.data.payer = '';
					this.data.receipient = '';
					this.data.quantity = '';
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
			},

		};
		await Util.load(this.div, 'parts/payreq.html', this.mode, {
			button,
			eos_approvers : userevt, 
		});
		Util.setData(this.div, this.data);
	}

	async initButtons() {
		const btns = [];
		btns.push({
			texxt : 'BACK',
			click : () => {
				this.term();
			}
		});
		return btns;
	}

}

//# sourceURL=payreq.js
