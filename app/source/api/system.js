// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.system');
const childProcess = require('child_process');

let cmdexec = async cmd => {
	return new Promise(function(resolve, reject) {
		childProcess.exec(cmd, (error, stdout, stderr) => {
			if(error) {
				log.error(stderr);
				reject(stderr);
			}
			resolve(stdout);
		});
	});
};


module.exports = {
	reg_account : async d => {
		let cmd = [ 
			'cleos system newaccount eosio --transfer ',
			d.id, d.active,
			'--stake-net "', d.stakenet , ' SYS" --stake-cpu "', d.stakecpu, ' SYS" --buy-ram-kbytes ', d.buyram
		].join(' ');
		try {
			let ret = await cmdexec(cmd);
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
			res = await cmdexec(cmd);
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
				res = await cmdexec(cmd);
				res = JSON.parse(res);
				res.forEach(elm=>{
					ret.keys[elm] = true;
				});
			}
		} catch (e) {
			throw e;
		}
		try {
			if (d.user) {
				cmd = 'cleos get account -j ' + d.user;
				res = await cmdexec(cmd);
				if (res!=='') {
					ret.user = JSON.parse(res);
				} else {
					ret.user = null;
				}
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
		return 'INVALID_KEY';
	}
};
