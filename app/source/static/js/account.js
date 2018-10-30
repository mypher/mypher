// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

Account = {
	data : null,
	user : null,
	logined : false,
	get : async u => {
		if (u) {
			Account.user = u;
		}
		Account.data = await Rpc.call(
			'system.get_state', 
			[{user:Account.user}]
		);
	},

	getActiveKey : () => {
		if (!Account.data.user) return '';
		let perm = Account.data.user.permissions;
		for ( let i in perm ) {
			if (perm[i].perm_name==='active') {
				return perm[i].required_auth.keys[0].key;
			}
		}
		return '';
	},
/*
	openWallet : async name => {
		let div = UI.popup(600,200);
		let open = async () => {
			let data = Util.getData(div, {});
			let ret = await Rpc.call(
				'system.open_wallet', 
				[{name:data.name, key:data.key}]
			);
			if (ret=='SUCCESS') {
				UI.closePopup();
				Account.makeContent();
				return;
			}
			UI.alert(_L(ret));
		};
		await Util.load(div, 'parts/openwallet.html', MODE.REF, {
			button : [{
				text : 'BACK',
				click : () => {
					UI.closePopup();
				}
			},{
				text : 'OPEN_WALLET',
				click : () => {
					open();
				}
			}]
		});
		Util.setData(div, {
			name : name,
			key : ''
		});
	},*/

	loginout : async () => {
		if (Account.logined) {
			Account.logined = false;
			Header.refresh();
		} else {
			let KEY = 'account';
			let ini = localStorage.getItem(KEY);
			try {
				ini = JSON.parse(ini);
			} catch (e) {
				ini = {
					name : '',
					pass : ''
				}
			}
			let div = UI.popup(600,200);
			let open = async () => {
				let data = Util.getData(div, {});
				try {
					let ret = await Rpc.call(
						'system.connect', 
						[{id:data.name, pass:data.pass}]
					);
					if (ret.error) {
						UI.alert(ret.error);
						return;
					}
					if (ret===true) {
						UI.closePopup();
						Account.user = data.name;
						localStorage.setItem(KEY, JSON.stringify(data));
						Account.logined = true;
						Header.refresh();
					} else {
						UI.alert(_L('INVALID_ID_OR_PASS'));
						return;
					}
				} catch (e) {
					UI.alert(e.message);
				}
			};
			await Util.load(div, 'parts/login.html', MODE.REF, {
				button : [{
					text : 'BACK',
					click : () => {
						UI.closePopup();
					}
				},{
					text : 'LOGIN',
					click : () => {
						open();
					}
				}]
			});
			Util.setData(div, ini);
		}
	},

	popup : async () => {
		Account.div = UI.popup(500,800);
		await Account.makeContent();
	},

	closePopup : () => {
		UI.closePopup();
		Account.div = null;
	},

	hasKey : key => {
		return Account.data.keys[key] ? true : false;
	},

	ref : async () => {
		if (Account.logined&&Account.user) {
			let user = new User({
				div : $('#main'),
				name : Account.user
			});
			History.run(_L('USER'), user);
		}
	},
	
	loginUser : () => {
		return Account.user ? Account.user : null;
	},

	isLogin : id => {
		return Account.logined && (Account.user===id);
	},

	makeContent : async () => {
		await Account.get();
		let div = Account.div;
		if (!div) return;
		let userbtn = [];
		let key = Account.getActiveKey();
		if (key) {
			userbtn.push({
				text : 'BROWSE',
				click : () => {
					UI.closePopup();
					let user = new User({
						div : $('#main'),
						name : Account.user
					});
					History.run(_L('USER'), user);
				}
			});
		}
		let ret = await Util.load(div, 'parts/account.html', MODE.REF, {
			button : [{
				text : 'BACK',
				click : () => {
					Account.closePopup();
				}
			}],
			user : userbtn
		});
		Util.setData(div, {
			account : Account.user,
			account_key : key
		});
		if (key) {
			let name = '';
			if (Account.hasKey(key)) {
				name = 'unlockmark';
			} else {
				name = 'lockmark';
			}
			div.find('*[name="keymark"]').addClass(name);
		}
		let data = [];
		Account.data.wallet.forEach(elm => {
			data.push([
				elm.name,
				elm.open ? '&nbsp;' : $('<div>').addClass('lockmark').click(()=> {
					Account.openWallet(elm.name);
				})
			]);
		});
		div.find('*[name="wallet"]').append(
			UI.table(
				'table table-hover table-condensed', 
				[_L('NAME1'), _L('LOCKSTATE')], data
			)
		);
		data = [];
		for (let i in Account.data.keys) {
			data.push([$('<small>').text(i)]);
		}
		div.find('*[name="keys"]').append(
			UI.table(
				'table table-hover table-condensed', 
				[_L('KEY')], data
			)
		);
		div.find('input[field="account"]').blur(function() {
			Account.user = $(this).val();
			Account.makeContent();
		});
	}
};
//# sourceURL=account.js
