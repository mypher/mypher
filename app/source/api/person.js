// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.user');
let cmn = require('./cmn');
let ipfs = require('../db/ipfs');

module.exports = {
	get : async d => {
		try {
			let ret = {};
			if (!cmn.isEmpty(d.user)) {
				/*
				cmd = 'cleos get account -j ' + d.user;
				res = await cmdexec(cmd);
				if (res!=='') {
					ret.sys = JSON.parse(res);
				} else {
					ret.sys = null;
				}*/
				ret.sys = {
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
			return new Promise((resolve, reject) => {
				ipfs.files.cat('QmPjXvs59U7zoBG9LLy99r6h4YXbiaxQjL8J6coAXrcApi', (err,file) => {
					if (err) {
						reject(err);
					}
					ret.info = JSON.parse(file.toString('utf-8'));
					resolve(ret);
				});
			});
		} catch (e) {
			throw e;	
		}
	},
	update : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.desc, f:cmn.isEmpty, r:true},
				{p:d.tags, f:cmn.isArray}
			])) {
				response = {code:'INVALID_PARAM'};
				return {code:'INVALID_PARAM'};
			}

			return new Promise( (resolve, reject) => {
				let data = {
					name : d.name,
					desc : d.desc,
					tags : d.tags
				};
				ipfs.files.add(Buffer.from(JSON.stringify(data), 'utf-8'), (err, res) => {
					if (err) {
						reject(err);
					}
					resolve(res);
				});
			});
		} catch (e) {
			throw e;
		}
	}
};