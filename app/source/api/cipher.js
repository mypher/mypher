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
	add : async d => {
		try {

		} catch (e) {
			throw e;
		}
	}
};