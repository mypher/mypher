// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.user');
let cmn = require('./cmn');
let ipfs = require('../db/ipfs');
let eos = require('../db/eos');

function makeSubKey(cipherid, version, draftno) {

	return parseInt(cipherid) << 32 | parseInt(version) << 16 | parseInt(draftno);
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

			// formalver
			// formaldraft
			// get alldata in current and previous version
			let skey = makeSubKey(ret.data.cipherid, ret.data.version-1, 0);
			let sdata = await eos.getDataWithSubKey({
				code : 'mypher',
				scope : 'mypher',
				table : 'cipher'
			}, 2, skey);
			sdata.forEach(d => {
				if (d.formal) {
					console.log(d.cipherid, d.version, d.draftno);
				}
			});
			return ret;
		} catch (e) {
			throw e;
		}
	}
};