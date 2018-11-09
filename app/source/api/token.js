// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.token');
const cmn = require('./cmn');

module.exports = {
	add : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.name, f:cmn.isEmpty, r:true},
	//			{p:d.type, f:cmn.isUint16},
	//			{p:d.issuer, f:cmn.isEosID},
	//			{p:d.limit, f:cmn.isNumber},
	//			{p:d.when, f:cmn.isUint16},
	//			{p:d.taskid, f:cmn.isNumber},
	//			{p:d.tokenid, f:cmn.isNumber},
	//			{p:d.reftoken, f:cmn.isNumber},
	//			{p:d.term, f:cmn.isDate},
	//			{p:d.rcalctype, f:cmn.isUint16},
	//			{p:d.nofdevtoken, f:cmn.isNumber}
			])) {
				return {code:'INVALID_PARAM'};
			}
			return await eos.pushAction({
				actions :[{
					account : 'mypher',
					name : 'tknew',
					authorization: [{
						actor: d.user,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			throw e;
		}
	}
};