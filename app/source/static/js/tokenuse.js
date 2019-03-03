// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+

class TokenUse extends View {

	constructor(d) {
		super();
		this.data = {
			personid : d.personid,
			name : d.name,
			quantity : d.quantity,
			tokenid : d.tokenid,
			token : d.token,
		};
		this.mode = MODE.REF;
		this.div = d.div;
		this.term = d.term;
	}

	async get() {
		try {
			const info = await Rpc.call(
				'token.get_issued_data',
				[{
					tokenid : this.data.tokenid,
					personid : this.data.personid,
				}]
			);
			const token = await Rpc.call(
				'token.get',
				[{tokenid:this.data.tokenid}]
			);
			this.data = info.token;
			this.data.type = token.type;
			this.data.personid = info.issue.owner;
			this.data.quantity = info.issue.quantity;
		} catch (e) {
			UI.alert(e);
		}
	}

	save() {
	}

	async refresh() {
		await Util.load(this.div, 'parts/tokenuse.html', this.mode, {
			button : [{
				text : 'USE',
				click : async () => {
					await this.use();
				}
			},{
				text : 'BACK',
				click : async () => {
					this.term();
				}
			}],
		});
		this.set(this.data);
	}

	async use() {
		if (parseInt(this.data.type)===Token.TYPE.DISTRIBUTE_CRYPTOCURRENCY) {
			const div = UI.popup(600,200);
			const click = async () => {
				try {
					const proposal_name = div.find('[field="propose_name"]').eq(0).val();
					await Rpc.call('token.reqpay', [{
						sender : this.data.personid,
						tokenid : this.data.tokenid,
						quantity : $('[field="use_quantity"]').val(),
						proposal_name,
					}]);
					UI.closePopup(); // ReqPay
					UI.closePopup(); // TOkenUSe
				} catch (e) {
					UI.alert(e);
				}
			}
			await Util.load(div, 'parts/reqpay.html', MODE.NEW, {
				button : [{
					text : 'PROPOSE_PAYMENTS',
					click,
				},{
					text : 'BACK',
					click : () => {
						UI.closePopup();
					}
				}]
			});
		} else {
			try {
				await Rpc.call('token.use', [{
					sender : this.data.personid,
					tokenid : this.data.tokenid,
					quantity : $('[field="use_quantity"]').val(),
				}]);
			} catch (e) {
				UI.alert(e);
			}
		}
	}

	async set(data) {
		this.data = data;
		Util.setData(this.div, {
			token : this.data.name + '(' + this.data.tokenid + ')',
			quantity : this.data.quantity,
			disposal : 0,
			use_quantity : 0,
		});
	}

	async draw() {
		await this.get();
		await this.refresh();
	}
};

TokenUse.prototype.Validator = {
};

//# sourceURL=tokenuse.js
