// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

Account = {
	data : null,
	user : null,
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
	},

	popup : async () => {
		Account.div = UI.popup(500,800);
		await Account.makeContent();
	},

	closePopup : () => {
		UI.closePopup();
		Account.div = null;
	},

	makeContent : async () => {
		await Account.get();
		let div = Account.div;
		if (!div) return;
		let ret = await Util.load(div, 'parts/account.html', MODE.REF, {
			button : [{
				text : 'BACK',
				click : () => {
					Account.closePopup();
				}
			}]
		});
		let key = Account.getActiveKey();
		Util.setData(div, {
			account : Account.user,
			account_key : key
		});
		if (key) {
			let name = '';
			if (Account.data.keys[key]) {
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
