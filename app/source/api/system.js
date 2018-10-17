// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.system');
let cmn = require('./cmn');
let eos = require('../db/eos');

module.exports = {
	reg_account : async d => {
		let cmd = [ 
			'cleos system newaccount eosio --transfer ',
			d.id, d.active,
			'--stake-net "', d.stakenet , ' SYS" --stake-cpu "', d.stakecpu, ' SYS" --buy-ram-kbytes ', d.buyram
		].join(' ');
		try {
			let ret = await cmn.cmd(cmd);
			return ret;
		} catch (e) {
			throw e;
		}
	},
	get_ipfs : async d => {
		let cmd = 'ipfs id'
		let ex = /(127\.0\.0\.1|::1)/;
		try {
			let ret = [];
			let res = await cmn.cmd(cmd);
			res = JSON.parse(res);
			if (res.Addresses instanceof Array) {
				res.Addresses.forEach(val => {
					if (ex.exec(val)===null) {
						ret.push(val);
					}
				});
			}
			return ret;
		} catch (e) {
			throw e;
		}
	},
	get_state : async d => {
		let cmd = 'cleos wallet list';
		let ret = {
			wallet : []
		};
		let res;
		try {
			if (d.wallet) {
				cmd += ' -n ' + d.wallet;
			}
			res = await cmn.cmd(cmd);
			res = res.split('\n');
			res.shift();
			res = res.join('\n');
			let open = false;
			JSON.parse(res).forEach(elm=> {
				elm = elm.split(' ');
				open = (elm.length===2) ? true : open;
				ret.wallet.push({name:elm[0], open:(elm.length===2)});
			});
			ret.keys = {};
			if (open) {
				cmd = 'cleos wallet keys';
				res = await cmn.cmd(cmd);
				res = JSON.parse(res);
				res.forEach(elm=>{
					ret.keys[elm] = true;
				});
			}
			eos.refresh();
		} catch (e) {
			throw e;
		}
		try {
			if (!cmn.isEmpty(d.user)) {
				/*
				cmd = 'cleos get account -j ' + d.user;
				res = await cmdexec(cmd);
				if (res!=='') {
					ret.user = JSON.parse(res);
				} else {
					ret.user = null;
				}*/
				ret.user = {
					"account_name": "testuser",
					"head_block_num": 10333,
					"head_block_time": "2018-10-06T23:29:40.000",
					"privileged": false,
					"last_code_update": "1970-01-01T00:00:00.000",
					"created": "2018-10-02T21:36:30.500",
					"ram_quota": 7971,
					"net_weight": 1000000000,
					"cpu_weight": 1000000000,
					"net_limit": {
					  "used": 261,
					  "available": "181054520818708",
					  "max": "181054520818969"
					},
					"cpu_limit": {
					  "used": 50082,
					  "available": "34526854169866",
					  "max": "34526854219948"
					},
					"ram_usage": 3984,
					"permissions": [{
						"perm_name": "active",
						"parent": "owner",
						"required_auth": {
						  "threshold": 1,
						  "keys": [{
							  "key": "EOS6KPyZwva1ciuzuoJ5Xhnti8vLvV93WtCEEp3c7ns55vwiXkW9r",
							  "weight": 1
							}
						  ],
						  "accounts": [],
						  "waits": []
						}
					  },{
						"perm_name": "owner",
						"parent": "",
						"required_auth": {
						  "threshold": 1,
						  "keys": [{
							  "key": "EOS6KPyZwva1ciuzuoJ5Xhnti8vLvV93WtCEEp3c7ns55vwiXkW9r",
							  "weight": 1
							}
						  ],
						  "accounts": [],
						  "waits": []
						}
					  }
					],
					"total_resources": {
					  "owner": "testuser",
					  "net_weight": "100000.0000 SYS",
					  "cpu_weight": "100000.0000 SYS",
					  "ram_bytes": 7971
					},
					"self_delegated_bandwidth": {
					  "from": "testuser",
					  "to": "testuser",
					  "net_weight": "100000.0000 SYS",
					  "cpu_weight": "100000.0000 SYS"
					},
					"refund_request": null,
					"voter_info": {
					  "owner": "testuser",
					  "proxy": "",
					  "producers": [
						"testuser"
					  ],
					  "staked": 2000000000,
					  "last_vote_weight": "917718590650898.62500000000000000",
					  "proxied_vote_weight": "0.00000000000000000",
					  "is_proxy": 0
					}
				  };
			}
		} catch (e) {
			// not found
		}
		return ret;
	},
	open_wallet : async d => {
		if (!d.name || !d.key) {
			throw 'invalid params';
		}
		let cmd = [
			'cleos wallet unlock -n',
			d.name,
			'--password',
			d.key
		].join(' ');
		try {
			let res = await cmdexec(cmd);
			return 'SUCCESS'
		} catch (e) {

		}
		return 'INVALID';
	}
};
