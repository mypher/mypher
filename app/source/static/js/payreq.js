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
				ms = await Rpc.call(
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
					let ms = await Rpc.call('multisig.search', [{id:d.payer}]);
					this.data.eos_approvers = ms.coowner;
					this.data.nof_eos_approvers = ms.threshold;
				}
			}
		} catch (e) {
			UI.alert(e);
		}
	}

	async refresh() {
		const btns = await this.initButtons()
		await Util.load(this.div, 'parts/payreq.html', this.mode, {
			button : btns
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
