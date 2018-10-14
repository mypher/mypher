// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.list');

module.exports = {
	cls : {
		system : require('./system'),
		user : require('./user')
	},
	call : async function (cn, mn, params, auth) {
		log.debug('api.call:' + cn + ':' + mn);
		let cls = this.cls[cn];
		if (cls===undefined||cls[mn]===undefined) {
			throw 'api not found';
		}
		try {
//			if (mn[0]==='_') {
//				if (auth&&dperson.validate({
//					id : auth.id,
//					tm : auth.tm,
//					data : JSON.stringify(params),
//					hash : auth.hash
//				})) {
//					log.info('success to validate');
//				} else {
//					return {
//						code : 'FAILED_TO_AUTH'
//					};
//				}
//				return await cls[mn](auth.id, ...params);
//			}
			return await cls[mn](...params);
		} catch (e) {
			throw e;
		}
	}
};
