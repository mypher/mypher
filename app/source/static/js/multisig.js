// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+

class MultiSig extends View {

	constructor(d) {
		super();
		this.data = {
			personid : d.personid,
			mode : d.mode,
		};
		this.div = d.div;
	}

	async get() {
	}

	save() {
	}

	async refresh() {
		await Util.load(this.div, 'parts/multisig.html', this.mode, {
			coowner : {
				click : key => {
					const user = new User({
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
					});;
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
			},
			button : this.makeBtn(),
		});
		this.set(this.data);
	}

	async makeBtn() {
		switch (this.mode) {
		case MODE.REF:
			return [{
				text : 'SEARCH',
				click : async () => {
					this.search();
				}
			},{
				text : 'CREATE',
				click : async () => {
					this.mode = MODE.NEW;
					this.refresh();
				}
			}];
		case MODE.NEW:
			return [{
				text : 'CREATE',
				click : async () => {
					this.create();
				}
			},{
				text : 'CANCEL',
				click : async () => {
					History.back();
				}
			}];
		}
		return [];
	}

	async search() {
		try {
			this.data = Util.getData(this.div, this.data);
			const l = await Rpc.call('multisig.search', [this.data]);
			this.data = l;
			this.refresh();
		} catch (e) {
			UI.alert(e);
		}
	}

	async create() {
		try {
			if (!Account.user) {
				UI.alert(_L('USER_NOT_LOGIN'));
				return;
			}
			this.data = Util.getData(this.div, this.data);
			this.data.personid = Account.user;
			this.Validator.check(this.data);
			const l = await Rpc.call('multisig.create', [this.data]);
			this.mode = MODE.REF;
			this.refresh();
		} catch (e) {
			UI.alert(e);
		}
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

MultiSig.prototype.Validator = {
	check : function(data) {
		const threshold = parseInt(data.threshold);
		if (isNaN(threshold)) {
			throw 'INVALID_PARAM';
		}
		if (data.coowner.length<threshold) {
			throw 'INVALID_PARAM';
		}
		if (!Util.isEosID(data.id)) {
			throw 'INVALID_PARAM';
		}
		if (data.coowner.length===0) {
			throw 'INVALID_PARAM';
		}
	}
};

//# sourceURL=multisig.js
