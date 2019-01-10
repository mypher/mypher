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

module.exports = {
	conv4store : d => {
		d.cdraftid = cmn.st2num(d.cdraftid);
		d.cipherid = cmn.st2num(d.cipherid);
		d.version = cmn.st2num(d.version);
		d.no = cmn.st2num(d.no);
		d.nofapproval = cmn.st2num(d.nofapproval);
		return d;
	},
	conv4disp : d => {
		d.cdraftid = cmn.num2st(d.cdraftid);
		d.cipherid = cmn.num2st(d.cipherid);
		d.version = cmn.num2st(d.version);
		d.no = cmn.num2st(d.no);
		d.nofapproval = cmn.num2st(d.nofapproval);
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
				if (ex.exec(v.name)!=null) {
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
				if (v.tags.includes(d.tag)) {
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
			const key = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cformal',
			}, d.cipherid);
			if (key===null||key.length===0) {
				return {code:'INVALID_PARAM'};
			}
			let ret = await get(d.cipherid, d.cdraftid || key.cdraftid);
			if (ret===null) {
				return {code:'INVALID_PARAM'};
			}
			const fml = await get(d.cipherid, key[0].cdraftid); 
			ret.formalver = fml.version;
			ret.formaldraft = fml.no;
			ret.cipherid = d.cipherid;
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
					cipherid : v.cipherid,
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
		await cmn.waitcommit(ret);
		try {
			// TODO:reserch another way
			// get recent record
			const sdata = await eos.getData({
				code : 'myphersystem',
				scope : d.cipherid,
				table : 'cdraft',
			}, 10000);
			if (sdata && sdata.rows instanceof Array) {
				for (let i=sdata.rows.length-1; i>=0; i-- ) {
					const rec = sdata.rows[i];
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