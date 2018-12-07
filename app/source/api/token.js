// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.token');
const cmn = require('./cmn');
const eos = require('../db/eos');

module.exports = {
	conv4store : function(d) {
		d.limit = cmn.st2num(d.limit);
		d.when = cmn.st2ui8(d.when);
		d.disposal = cmn.st2ui8(d.disposal);
		d.type = cmn.st2ui8(d.type);
		d.taskid = cmn.st2num(d.taskid);
		d.tokenid = cmn.st2num(d.tokenid);
		d.reftoken = cmn.st2num(d.reftoken);
		d.rcalctype = cmn.st2ui8(d.rcalctype);
		d.nofdevtoken = cmn.st2num(d.nofdevtoken);
		d.issuer2 = cmn.st2num(d.issuer2);
		return d;
	},
	conv4disp : function(d) {
		d.limit = cmn.num2st(d.limit);
		d.when = cmn.ui82st(d.when);
		d.disposal = cmn.ui82st(d.disposal);
		d.type = cmn.ui82st(d.type);
		d.taskid = cmn.num2st(d.taskid);
		d.tokenid = cmn.num2st(d.tokenid);
		d.reftoken = cmn.num2st(d.reftoken);
		d.rcalctype = cmn.ui82st(d.rcalctype);
		d.nofdevtoken = cmn.num2st(d.nofdevtoken);
		d.issuer2 = cmn.num2st(d.issuer2);
		return d;
	},

	add : async function(d) {
		/*try {
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
			d = this.conv4store(d);
		} catch (e) {
			return {code:'INVALID_PARAM'};
		}*/
		try {
			d = this.conv4store(d);
			d = await eos.pushAction({
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
			return this.conv4disp(d);
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	list : async function(d) {
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
					ret.push(v);
				}
			});
			return this.conv2disp(ret);
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	list_for_cipher : async function(d) {
		try {
			const data = await eos.getDataWithSubKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token',
				limit : 65535
			}, 2, 'i64', d.cipherid, d.cipherid+1);
			let ret =[];
			data.forEach(v => {
				if (d.list.includes(v.id)) {
					ret.push(v);
				}
			});
			return this.conv4disp(ret);
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},

	update : async function(d) {
/*		try {
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
		} catch (e) {
			return {code:'INVALID_PARAM'};
		}*/
		try {
			d = this.conv4store(d);
			d = await eos.pushAction({
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
			return this.conv4disp(d);
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	get : async function(d) {
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
			return this.conv4disp(ret[0]);
		} catch (e) {
			return cmn.parseEosError(e);
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
			return cmn.parseEosError(e);
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
				if (v.issuer2 === n) {
					ret.push({
						id : v.id,
						name : v.name,
					});
				}
			});
			return ret;
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
			return cmn.parseEosError(e);
		}
	},
};