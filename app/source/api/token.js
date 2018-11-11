// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.token');
const cmn = require('./cmn');
const eos = require('../db/eos');

module.exports = {
	add : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.sender, f:cmn.isEosID},
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.limit, f:cmn.isStrNumber},
				{p:d.when, f:cmn.isStrLen, v:1},
				{p:d.when, f:cmn.isStrNumber },
				{p:d.type, f:cmn.isStrLen, v:1},
				{p:d.type, f:cmn.isStrNumber },
				{p:d.type, f:cmn.isEmpty, r:true },
				{p:d.taskid, f:cmn.isStrNumber},
				{p:d.tokenid, f:cmn.isStrNumber},
				{p:d.reftoken, f:cmn.isStrNumber},
				{p:d.term, f:cmn.isDateTime},
				{p:d.rcalctype, f:cmn.isStrNumber},
				{p:d.nofdevtoken, f:cmn.isStrNumber}
			])) {
				return {code:'INVALID_PARAM'};
			}
			if (d.issuertype==='0') {
				const issuer = parseInt(d.issuer);
				if (isNaN(issuer)) {
					return {code:'INVALID_PARAM'};
				}
				d.issuer = '';
				d.issuer2 = issuer;
			} else if (d.issuertype==='1') {
				if (!cmn.isEosID(d.issuer)) {
					return {code:'INVALID_PARAM'};
				}
				d.issuer2 = 0;
			} else {
				return {code:'INVALID_PARAM'};
			}
			d.limit = parseInt(d.limit)||0;
			d.when = parseInt(d.when)||0;
			d.type = parseInt(d.type)||0;
			d.taskid = parseInt(d.taskid)||0;
			d.tokenid = parseInt(d.tokenid)||0;
			d.reftoken = parseInt(d.reftoken)||0;
			d.rcalctype = parseInt(d.rcalctype)||0;
			d.nofdevtoken = parseInt(d.nofdevtoken)||0;
		} catch (e) {
			return {code:'INVALID_PARAM'};
		}
		try {
			return await eos.pushAction({
				actions :[{
					account : 'mypher',
					name : 'tknew',
					authorization: [{
						actor: d.sender,
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