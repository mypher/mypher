// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function User(d) {
	this.mode = MODE.REF;
	this.data = {
		personid : d.name
	};
	this.div = d.div;
}

User.prototype = {
	getActiveKey : function(sys) {
		let ret = '';
		sys.permissions.some(v => {
			if (v.perm_name==='active') {
				if (v.required_auth.keys.length>0) {
					ret = v.required_auth.keys[0].key;
					return true;
				}
				return false;
			}
			return false;
		});
		return ret;
	},

	get : async function() {
		try {
			const info = await Rpc.call(
				'person.get',
				[{personid:this.data.personid}]
			);
			this.data = info.data||{personid:this.data.personid};
			this.data.pkey = this.getActiveKey(info.sys);
			this.data.sysdata = JSON.stringify(info.sys);
			Rpc.call(
				'person.get_desc',
				[this.data]
			).then(d => {
				for ( let k in d ) {
					this.data[k] = d[k];
				}
				this.refresh();
			}).catch (e => {
				UI.alert(e);
			});
		} catch (e) {
			UI.alert(e);
		}
	},

	update : async function() {
		let data = Util.getData(this.div, {});
		try {
			await Rpc.call('person.update', [data]);
			this.data = data;
			this.mode = MODE.REF;
			this.refresh();
		} catch (e) {
			throw e;
		}
	},

	refresh : async function() {
		let btn = [];
		switch (this.mode) {
		case MODE.REF:
			if (Account.isLogin(this.data.personid)) {
				btn.push({
					text : 'EDIT',
					click : () => {
						this.mode = MODE.EDIT;
						this.refresh();
					}
				});
			}
			btn.push({
				text : 'BACK',
				click : () => {
					History.back();
				}
			});
			break;
		case MODE.EDIT:
			btn.push({
				text : 'COMMIT',
				click : () => {
					this.update();
				}
			});
			btn.push({
				text : 'BACK',
				click : () => {
					History.back();
				}
			});
			break;
		}
		const self = this;
		await Util.load(this.div, 'parts/user.html', this.mode, {
			button :btn,
			tags :[{
				click : function() {
					alert(1);
				}
			}],
			tokenlist : {
				col : [
					{ width : 1, label : _L('ID'), name : 'tokenid' },
					{ width : 3, label : _L('ISSUER'), name : 'issuer' },
					{ width : 4, label : _L('NAME2'), name : 'name' },
					{ width : 2, label : _L('QUANTITY'), name : 'quantity' },
					{ width : 2, label : _L(''), btn : 'USE_EX' },
				],
				key : [],
				ondata : (d, list) => {
					if (this.data.tokenlist.length===0) {
						list.show([]);
						return;
					}
					const conv = o => {
						return (o.name ? o.name : '') + '(' + o.cipherid + ')';
					}
					Rpc.call('token.list_for_person', [{
						list : this.data.tokenlist,
						personid : this.data.personid,
					}]).then(ret => {
						let l = [];
						ret.forEach(v => {
							l.push({
								tokenid : v.tokenid,
								issuer : conv(v.issuer),
								name : v.name,
								quantity : v.quantity
							});
						});
						list.show(l);
					}).catch( e=> {
						UI.alert(e);
					});
				},
				onselect : (d, list) => {
					const token = new Token({
						div : $('#main'),
						tokenid : d.tokenid,
						mode : MODE.REF
					});
					History.run(_L('TOKEN'), token);
				},
				onbutton : (d, list) => {
					const tu = new TokenUse({
						div : $('#main'),
						personid : self.data.personid,
						person : self.data.name,
						tokenid : d.val.tokenid,
						token : d.val.name,
						quantity : d.val.quantity,
						mode : MODE.EDIT,
					});
					History.run(_L('TOKEN_USE'), tu);
				},
				onadd : () => {}
			},
		});
		Util.setData(this.div, this.data);
	},

	save : function() {
	},

	draw : async function() {
		await this.get();
		await this.refresh();
	}

};

//# sourceURL=user.js
