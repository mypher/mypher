// Copyright (C) 2018 The Mypher Authors
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
		this.div = d.div;
	}

	async get() {
	}

	save() {
	}

	async refresh() {
		await Util.load(this.div, 'parts/tokenuse.html', this.mode, {
			button : [{
				text : 'USE',
				click : async () => {
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
			}],
		});
		this.set(this.data);
	}

	async set(data) {
		this.data = data;
		Util.setData(this.div, {
			token : this.data.token + '(' + this.data.tokenid + ')',
			quantity : this.data.quantity,
			way2use : 0,
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
