// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.system');
const childProcess = require('child_process');

module.exports = {
	reg_account : async d => {
		return new Promise(function(resolve, reject) {
			let cmd = [ 
				'cleos system newaccount eosio --transfer ',
				d.id, d.active,
				'--stake-net "100000.0000 SYS" --stake-cpu "100000.0000 SYS" --buy-ram-kbytes 8'
			].join(' ');
			childProcess.exec(cmd, (error, stdout, stderr) => {
				if(error) {
					log.error(stderr);
					reject({code:'ERROR', desc:stderr});
				}
				resolve({code:'SUCCESS', desc:stdout});
			});
		});
	}
};
