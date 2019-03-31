// Copyright (C) 2018-2019 The Mypher Authors
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
		const col = (this.data.personid===Account.user) 
			? [
					{ width : 1, label : _L('ID'), name : 'tokenid' },
					{ width : 2, label : _L('ISSUER'), name : 'issuer' },
					{ width : 3, label : _L('NAME2'), name : 'tkname' },
					{ width : 2, label : _L('QUANTITY'), name : 'quantity' },
					{ width : 2, label : _L('PAYINF'), name : 'payinf' },
					{ width : 2, label : _L(''), btn : 'USE_EX', name : 'useex' },
			] : [
					{ width : 1, label : _L('ID'), name : 'tokenid' },
					{ width : 3, label : _L('ISSUER'), name : 'issuer' },
					{ width : 4, label : _L('NAME2'), name : 'tkname' },
					{ width : 2, label : _L('QUANTITY'), name : 'quantity' },
					{ width : 2, label : _L('PAYINF'), name : 'payinf' },
			];
		const col2 = [
			{ width : 10, label : _L('NAME2'), name : 'proposal_name' },
			{ width : 2, label : _L(''), btn : 'DETAILS' },
			
		];
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
							name : v.pname + '（' + v.personid + '）'
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
							name : v.pname + '（' + v.personid + '）'
						});
					});
					return ret;
				} catch (e) {
					UI.alert(e);
					return [];
				}
			},

		};
		await Util.load(this.div, 'parts/user.html', this.mode, {
			button :btn,
			tags :[{
				click : function() {
					alert(1);
				}
			}],
			tokenlist : {
				col,
				key : [],
				ondata : (d, list) => {
					if (this.data.tokenlist.length===0) {
						list.show([]);
						return;
					}
					const conv = o => {
						return (o.cname ? o.cname : '') + '(' + o.cipherid + ')';
					}
					Rpc.call('token.list_for_person', [{
						list : this.data.tokenlist,
						personid : this.data.personid,
					}]).then(ret => {
						const l = [];
						ret.forEach(v => {
							l.push({
								tokenid : v.tokenid,
								issuer : conv(v.issuer),
								name : v.tkname,
								quantity : v.quantity,
								payinf : v.payinf,
								useex : (v.payinf==='')
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
					const div = UI.popup(500,300);
					const tu = new TokenUse({
						div,
						personid : self.data.personid,
						person : self.data.pname,
						tokenid : d.val.tokenid,
						token : d.val.tkname,
						quantity : d.val.quantity,
						mode : MODE.EDIT,
						term : () => {
							UI.closePopup();
						}
					});
					tu.draw();
				},
				onadd : () => {}
			},
			payreqlist : {
				col : col2,
				key : [],
				ondata : (d, list) => {
					Rpc.call('multisig.get_tran_list', [{
						account : this.data.personid,
					}]).then(ret => {
						list.show(ret);
					}).catch (e=> {
						UI.alert(e);
					});
				},
				onselect : (d, list) => {
					const div = UI.popup(800,600);
					const pr = new PayReq({
						div,
						proposer : this.data.personid,
						proposal_name : d.proposal_name,
						term : () => {
							UI.closePopup();
						}
					});
					pr.draw();
				},
				onbutton : (d, list) => {
				}
			}
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
