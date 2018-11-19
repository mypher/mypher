// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.token');
const cmn = require('./cmn');
const eos = require('../db/eos');


const ISSUER_CIPHER = '0';
const ISSUER_INDIVIDUAL = '1';

module.exports = {
	formdata : function(d) {
		if (d.issuertype===ISSUER_CIPHER) {
			const issuer = parseInt(d.issuer);
			if (isNaN(issuer)) {
				return {code:'INVALID_PARAM'};
			}
			d.issuer = '';
			d.issuer2 = issuer;
		} else if (d.issuertype===ISSUER_INDIVIDUAL) {
			if (!cmn.isEosID(d.issuer)) {
				return {code:'INVALID_PARAM'};
			}
			d.issuer2 = cmn.NUMBER_NULL; 
		} else {
			return {code:'INVALID_PARAM'};
		}
		d.limit = parseInt(d.limit)||0;
		d.when = parseInt(d.when)||0;
		d.disposal = parseInt(d.disposal)||0;
		d.type = parseInt(d.type)||0;
		d.taskid = parseInt(d.taskid);
		d.taskid = isNaN(d.taskid) ? cmn.NUMBER_NULL : d.taskid;
		d.tokenid = parseInt(d.tokenid);
		d.tokenid = isNaN(d.tokenid) ? cmn.NUMBER_NULL : d.tokenid;
		d.reftoken = parseInt(d.reftoken)||0;
		d.rcalctype = parseInt(d.rcalctype)||0;
		d.nofdevtoken = parseInt(d.nofdevtoken)||0;
		return d;
	},

	add : async function(d) {
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
				{p:d.disposal, f:cmn.isStrLen, v:1},
				{p:d.disposal, f:cmn.isStrNumber },
				{p:d.disposal, f:cmn.isEmpty, r:true },
				{p:d.taskid, f:cmn.isStrNumber},
				{p:d.tokenid, f:cmn.isStrNumber},
				{p:d.reftoken, f:cmn.isStrNumber},
				{p:d.term, f:cmn.isDateTime},
				{p:d.rcalctype, f:cmn.isStrNumber},
				{p:d.nofdevtoken, f:cmn.isStrNumber}
			])) {
				return {code:'INVALID_PARAM'};
			}
			d = this.formdata(d);
			if (d.code) {
				return d;
			}
		} catch (e) {
			return {code:'INVALID_PARAM'};
		}
		try {
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
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
	},

	list : async d => {
		try {
			if (!cmn.isString(d.name)) {
				return {code:'INVALID_PARAM'};
			}
			const data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token',
			}, 10000);
			let ret = [];
			data.rows.forEach( v=> {
				if (v.name.includes(d.name)) {
					if (v.issuer==='') {
						v.issuer = v.issuer2;
						v.issuertype = ISSUER_CIPHER;
					} else {
						v.issuertype = ISSUER_INDIVIDUAL;
					}
					ret.push(v);
				}
			});
			ret.when = String(ret.when);
			ret.disposal = String(ret.disposal);
			ret.type = String(ret.type);
			ret.rcalctype = String(ret.rcalctype);
			return ret;
		} catch (e) {
			throw e;
		}
	},

	update : async function(d) {
		try {
			if (!cmn.chkTypes([
				{p:d.id, f:cmn.isNumber},
				{p:d.sender, f:cmn.isEosID},
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.limit, f:cmn.isStrNumber},
				{p:d.when, f:cmn.isStrLen, v:1},
				{p:d.when, f:cmn.isStrNumber },
				{p:d.type, f:cmn.isStrLen, v:1},
				{p:d.type, f:cmn.isStrNumber },
				{p:d.type, f:cmn.isEmpty, r:true },
				{p:d.disposal, f:cmn.isStrLen, v:1},
				{p:d.disposal, f:cmn.isStrNumber },
				{p:d.disposal, f:cmn.isEmpty, r:true },
				{p:d.taskid, f:cmn.isStrNumber},
				{p:d.tokenid, f:cmn.isStrNumber},
				{p:d.reftoken, f:cmn.isStrNumber},
				{p:d.term, f:cmn.isDateTime},
				{p:d.rcalctype, f:cmn.isStrNumber},
				{p:d.nofdevtoken, f:cmn.isStrNumber}
			])) {
				return {code:'INVALID_PARAM'};
			}
			d = this.formdata(d);
			if (d.code) {
				return d;
			}
		} catch (e) {
			return {code:'INVALID_PARAM'};
		}
		try {
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'tkupdate',
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
	},

	get : async d=> {
		try {
			let ret = {};
			ret = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token'
			}, d.id);
			if (ret===null||ret.length===0) {
				return {code:'NOT_FOUND'};
			}
			ret = ret[0];
			if (ret.issuer==='') {
				ret.issuer = ret.issuer2;
				ret.issuertype = ISSUER_CIPHER;
			} else {
				ret.issuertype = ISSUER_INDIVIDUAL;
			}
			ret.taskid = cmn.id2st(ret.taskid);
			ret.tokenid = cmn.id2st(ret.tokenid);
			return ret;
		} catch (e) {
			throw e;
		}
	},
	list_byname : async n => {
		try {
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token',
				limit : 0,
			});
			let ret = [];
			data.rows.forEach(v => {
				if (String(v.id).includes(n) || v.name.includes(n)) {
					ret.push({
						id : v.id,
						name : v.name,
						tags : v.tags
					});
				}
			});
			return ret;
		} catch (e) {
			throw e;
		}
	},
	list_bycipherid : async n => {
		try {
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token',
				limit : 0,
			});
			let ret = [];
			n = parseInt(n);
			data.rows.forEach(v => {
				if (v.cipherid === n) {
					ret.push({
						id : v.id,
						name : v.name,
					});
				}
			});
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
				table : 'token',
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
};