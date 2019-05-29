// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.list');

module.exports = {
	cls : {
		system : require('./system'),
		person : require('./person'),
		cipher : require('./cipher'),
		token : require('./token'),
		task : require('./task'),
		multisig : require('./multisig')
	},
	call : async function (cn, mn, params, auth) {
		log.debug('api.call:' + cn + ':' + mn);
		let cls = this.cls[cn];
		if (cls===undefined||cls[mn]===undefined) {
			throw 'api not found';
		}
		try {
			return await cls[mn](...params);
		} catch (e) {
			throw e;
		}
	}
};
