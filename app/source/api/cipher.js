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
	conv4store : function(d) {
		d.id = cmn.st2num(d.id);
		d.cipherid = cmn.st2num(d.cipherid);
		d.version = cmn.st2num(d.version);
		d.draftno = cmn.st2num(d.draftno);
		d.drule_req = cmn.st2num(d.drule_req);
		return d;
	},
	conv4disp : function(d) {
		d.id = cmn.num2st(d.id);
		d.cipherid = cmn.num2st(d.cipherid);
		d.version = cmn.num2st(d.version);
		d.draftno = cmn.num2st(d.draftno);
		d.drule_req = cmn.num2st(d.drule_req);
		return d;
	},

	list : async d => {
		try {
			// TODO:performance
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cformal',
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
			return cmn.parseEosError(e);
		}
	},
	list_bytag : async d => {
		try {
			// TODO:performance
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cformal',
			}, 10000);
			let ret = [];
			data.rows.forEach(v => {
				if (v.formal&&v.tags.includes(d.tag)) {
					ret.push(v);
				}
			});
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	get : async function(d) {
		try {
			const get = async (cipherid, cdraftid) => {
				let ret = await eos.getDataWithPKey({
					code : 'myphersystem',
					scope : cipherid,
					table : 'cdraft',
				}, cdraftid);
				if (ret===null||ret.length===0) {
					return null;
				}
				return ret[0];
			};
			let ret = await get(d.cipherid, d.cdraftid);
			if (ret===null) {
				return {code:'INVALID_PARAM'};
			}
			const key = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cformal',
			}, cformalid);
			if (key===null||key.length===0) {
				return {code:'INVALID_PARAM'};
			}
			const fml = await get(d.cipherid, key.cdraftid); 
			ret.formalver = fml.version;
			ret.formaldraft = fml.draftid;
			return this.conv4disp(ret);
		} catch (e) {
			return cmn.parseEosError(e);
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
			const data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cformal',
				limit : 0,
				lower_bound : min,
				upper_bound : max + 1,
			});
			data.rows.forEach(v => {
				ret.push({
					id : v.cipherid,
					name : v.name,
				});
			});
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	copy : async d => {
		let ret;
		try {
			d.sender = d.user;
			ret = await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'cnewdraft',
					authorization: [{
						actor: d.user,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			return cmn.parseEosError(e);
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
			const sdata = await eos.getData({
				code : 'myphersystem',
				scope : d.cipherid,
				table : 'cdraft',
			}, 10000);
			if (sdata instanceof Array) {
				for (let i=sdata.length-1; i>=0; i-- ) {
					const rec = sdata[i];
					if (rec.editors.length===1&&rec.editors[0]===d.user) {
						return rec.cdraftid;
					}
				}
			}
			return -1;
		} catch (e) {
			return cmn.parseEosError(e);
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
			return {code:e};
		}
	},
	add : async function(d) {
		try {
			if (!cmn.chkTypes([
				{p:d.purpose, f:cmn.isString}
			])) {
				return {code:'INVALID_PARAM'};
			}
			let ret = await ipfs.add({
				purpose : d.purpose
			});
			d.hash = ret[0].path;
		} catch (e) {
			return {code:e};
		}
		try {
			d.sender = d.user;
			d = this.conv4store(d);
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
			return cmn.parseEosError(e);
		}
	},
	edit : async function(d) {
		try {
			if (!cmn.chkTypes([
				{p:d.purpose, f:cmn.isString}
			])) {
				return {code:'INVALID_PARAM'};
			}
			let ret = await ipfs.add({
				purpose : d.purpose
			});
			d.hash = ret[0].path;
			d.sender = d.user;
			d = this.conv4store(d);
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
			return cmn.parseEosError(e);
		}
	},
	approve : async d => {
		try {
			d.sender = d.user;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : d.approve ? 'capprove' : 'crevapprove',
					authorization: [{
						actor: d.user,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	hist : async d => {
		try {
			if (!cmn.isNumber(d.cipherid)) {
				return {code:'INVALID_PARAM'};
			}
			const data = await eos.getData({
				code : 'myphersystem',
				scope : d.cipherid,
				table : 'cdraft',
			});
			if (data&&data.rows) {
				return data.rows;
			}
			return [];
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	getFormalFromCipherID : async d => {
		try {
			if (!cmn.isNumber(d.cipherid)) {
				return {code:'INVALID_PARAM'};
			}
			const ret = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cformal',
			}, d.cipherid);
			return (ret.cdraftid===d.cdraftid);
		} catch (e) {
			return cmn.parseEosError(e);
		}
	}
};