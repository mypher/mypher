// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

class PayReq {
	constructor(d) {
		this.div = d.div;
		this.mode = d.mode;
		this.data = {
			multisig : d.multisig,
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
			if (this.data.multisig) {
				let ms = await Rpc.call('multisig.search', [{id:d.multisig}]);
				this.data.eos_approvers = ms.coowner;
				this.data.nof_eos_approvers = ms.threshold;
			}
			if (this.data.porposer && this.data.proposal_name) {
				ms = await Rpc.call(
					'multisig.get_tran_info',
					[{account : this.data.proposer, proposal_name : this.data.proposal_name}]
				);
				this.data.approve_payment = ms.approved
			}
		} catch (e) {
			UI.alert(e);
		}
	}

}
