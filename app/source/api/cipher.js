// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.user');
const cmn = require('./cmn');
const ipfs = require('../db/ipfs');
const eos = require('../db/eos');
const bignum = require('bignum');

const shift32 = bignum.pow(2,32);
const shift16 = bignum.pow(2,16);

function makeSubKey(cipherid, version, draftno) {
	cipherid = bignum(cipherid);
	version = bignum(version);
	draftno = bignum(draftno);
	return cipherid.mul(shift32).add(version.mul(shift16)).add(draftno).toString();
}

module.exports = {
	list : async d => {
		try {
			// TODO:performance
			let data = await eos.getData({
				code : 'mypher',
				scope : 'mypher',
				table : 'ckey',
			}, 10000);
			let ret = [];
			let ex = new RegExp(d.name);
			data.rows.forEach(v => {
				if (v.formal&&ex.exec(v.name)!=null) {
					ret.push(v);
				}
			});
			return ret;
		} catch (e) {
			throw e;
		}
	},
	list_bytag : async d => {
		try {
			// TODO:performance
			let data = await eos.getData({
				code : 'mypher',
				scope : 'mypher',
				table : 'ckey',
			}, 10000);
			let ret = [];
			data.rows.forEach(v => {
				if (v.formal&&v.tags.includes(d.tag)) {
					ret.push(v);
				}
			});
			return ret;
		} catch (e) {
			throw e;
		}
	},
	get : async d=> {
		try {
			let ret = {};
			ret.data = await eos.getDataWithPKey({
				code : 'mypher',
				scope : 'mypher',
				table : 'cipher',
			}, d.id);
			if (ret.data===null||ret.data.length===0) {
				return {code:'NOT_FOUND'};
			}
			ret.data = ret.data[0];
			let key = await eos.getDataWithPKey({
				code : 'mypher',
				scope : 'mypher',
				table : 'ckey',
			}, d.id);
			if (key===null||key.length===0) {
				return {code:'NOT_FOUND'};
			}
			ret.data.name = key[0].name;
			ret.data.tags = key[0].tags;

			// get alldata in current and previous version
			let min = makeSubKey(ret.data.cipherid, ret.data.version-1, 0);
			let max = makeSubKey(ret.data.cipherid, ret.data.version+1, 0);
			let sdata = await eos.getDataWithSubKey({
				code : 'mypher',
				scope : 'mypher',
				table : 'cipher',
				limit : 65535
			}, 2, 'i64', min, max);
			if (sdata instanceof Array) {
				sdata.forEach(d => {
					if (d.formal) {
						ret.data.formalver = d.version;
						ret.data.formaldraft = d.draftno;
					}
				});
			}
			return ret;
		} catch (e) {
			throw e;
		}
	},
	copy : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.user, f:cmn.isEosID},
				{p:d.id, f:cmn.isNumber}
			])) {
				return {code:'INVALID_PARAM'};
			}
			d.sender = d.user;
			return await eos.pushAction({
				actions :[{
					account : 'mypher',
					name : 'ccopy',
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
	},
	get_desc : async d => {
		try {
			if (cmn.isEmpty(d.hash)) {
				return {};
			}
			if (!cmn.isIpfsKey(d.hash)) {
				return {code:'INVALID_PARAM'};
			}
			return await ipfs.get(d.hash);
		} catch (e) {
			throw e;
		}
	},
	add : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.user, f:cmn.isEosID},
				{p:d.editors, f:cmn.isArray},
				{p:d.drule_req, f:cmn.isUint16},
				{p:d.drule_auth, f:cmn.isArray},
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.tags, f:cmn.isArray},
				{p:d.purpose, f:cmn.isString}
			])) {
				return {code:'INVALID_PARAM'};
			}
			let ret = await ipfs.add({
				purpose : d.purpose
			});
			d.hash = ret[0].path;
			d.sender = d.user;
			return await eos.pushAction({
				actions :[{
					account : 'mypher',
					name : 'cnew',
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