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
				{p:d.type, f:cmn.isStrLen, v:1},
				{p:d.type, f:cmn.isStrNumber },
				{p:d.issuer, f:cmn.isEosID},
				{p:d.limit, f:cmn.isStrNumber},
				{p:d.when, f:cmn.isStrLen, v:1},
				{p:d.when, f:cmn.isStrNumber },
				{p:d.taskid, f:cmn.isStrNumber},
				{p:d.tokenid, f:cmn.isStrNumber},
				{p:d.reftoken, f:cmn.isStrNumber},
				{p:d.term, f:cmn.isDateTime},
				{p:d.rcalctype, f:cmn.isStrNumber},
				{p:d.nofdevtoken, f:cmn.isStrNumber}
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