// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.multisig');
const cmn = require('./cmn');

module.exports = {
	genkey : async function(d) {
		const pick = d => {
			const ret = /: ([a-zA-Z0-9]*)/.exec(d);
			if (ret===null||ret.length!==2) {
				return '';
			}
			return ret[1];
		};
		try {
			let ret = await cmn.cmd('cleos create key --to-console');
			ret = ret.split('\n');
			if (ret.length<=2) {
				return {code:'FAILED_TO_CREATE'};
			}
			return {
				pubkey : pick(ret[0]),
				prikey : pick(ret[1]),
			};
		} catch (e) {
			return {code:e};
		}
	}
};