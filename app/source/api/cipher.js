// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.cipher');
const cmn = require('./cmn');
const ipfs = require('../db/ipfs');
const eos = require('../db/eos');
const bignum = require('bignum');

const shift24 = bignum.pow(2,24);
const shift12 = bignum.pow(2,12);

function makeSubKey(cipherid, version, draftno) {
	cipherid = bignum(cipherid);
	version = bignum(version);
	draftno = bignum(draftno);
	return cipherid.mul(shift24).add(version.mul(shift12)).add(draftno).toString();
}

module.exports = {
	list : async d => {
		try {
			// TODO:performance
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
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
				code : 'myphersystem',
				scope : 'myphersystem',
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
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cipher',
			}, d.id);
			if (ret.data===null||ret.data.length===0) {
				return {code:'NOT_FOUND'};
			}
			ret.data = ret.data[0];
			let key = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
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
				code : 'myphersystem',
				scope : 'myphersystem',
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
	name : async d => {
		try {
			let min='', max = 0;
			d.forEach(v => {
				v = parseInt(v);
				if (isNaN(v)) return;
				if (min==='') {
					min = v;
					max = v;
				} else {
					min = (min>v) ? v : min;
					max = (max<v) ? v : max;
				}
			});
			let ret = [];
			if (min==='') {
				return ret;
			}
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'ckey',
				limit : 0,
				lower_bound : min,
				upper_bound : max + 1,
			});
			data.rows.forEach(v => {
				ret.push({
					id : v.id,
					name : v.name,
				});
			});
			return ret;
		} catch (e) {
			throw e;
		}
	},
	copy : async d => {
		let ret;
		try {
			if (!cmn.chkTypes([
				{p:d.user, f:cmn.isEosID},
				{p:d.id, f:cmn.isNumber}
			])) {
				return {code:'INVALID_PARAM'};
			}
			d.sender = d.user;
			ret = await eos.pushAction({
				actions :[{
					account : 'myphersystem',
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
		await cmn.sleep(500);
		for ( let i=0; i<5; i++) {
			try {
				await cmn.sleep(300);
				ret = await eos.getTransaction(ret.transaction_id, ret.processed.block_num);
				break;
			} catch (e) {
				// not sent yet
			}
		}
		try {
			// TODO:reserch another way
			// get recent record
			const min = makeSubKey(d.cipherid, 0, 0);
			const max = makeSubKey(d.cipherid+1,0, 0);
			const sdata = await eos.getDataWithSubKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cipher',
				limit : 65535
			}, 2, 'i64', min, max);
			if (sdata instanceof Array) {
				let prever = sdata[sdata.length-1].version;
				for (let i=sdata.length-1; i>=0; i-- ) {
					const rec = sdata[i];
					// copied record not found
					if (prever!==rec.version) {
						break;
					}
					if (rec.editors.length===1 && rec.editors[0]===d.user) {
						return rec.id;
					}
					prever = rec.version;
				}
			}
			return -1;
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
					account : 'myphersystem',
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
	},
	edit : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.id, f:cmn.isNumber},
				{p:d.cipherid, f:cmn.isNumber},
				{p:d.version, f:cmn.isUint16},
				{p:d.draftno, f:cmn.isUint16},
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
					account : 'myphersystem',
					name : 'cupdate',
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

	hist : async d => {
		try {
			if (!cmn.isNumber(d.cipherid)) {
				return {code:'INVALID_PARAM'};
			}
			let min = makeSubKey(d.cipherid, 1, 1);
			let max = makeSubKey(d.cipherid+1, 1, 1);
			let sdata = await eos.getDataWithSubKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cipher',
				limit : 65535
			}, 2, 'i64', min, max);
			if (sdata instanceof Array) {
				sdata.forEach(async d => {
					let key = await eos.getDataWithPKey({
						code : 'myphersystem',
						scope : 'myphersystem',
						table : 'ckey',
					}, d.id);
					d.name = key.name
				});
				return sdata;
			} else {
				return [];
			}
		} catch (e) {
			throw e;
		}
	}
};