// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.token');
const cmn = require('./cmn');
const eos = require('../db/eos');
const cipher = require('./cipher');

module.exports = {
	conv4store : function(d) {
		d.limit = cmn.st2num(d.limit);
		d.when = cmn.st2ui8(d.when);
		d.disposal = cmn.st2ui8(d.disposal);
		d.type = cmn.st2ui8(d.type);
		d.taskid = cmn.st2num(d.taskid);
		d.extokenid = cmn.st2num(d.extokenid);
		d.reftoken = cmn.st2num(d.reftoken);
		d.rcalctype = cmn.st2ui8(d.rcalctype);
		d.nofdesttoken = cmn.st2num(d.nofdesttoken);
		if (d.nofdesteos) {
			d.nofdesteos *= 10000;
		}
		d.nofdesteos = cmn.st2num(d.nofdesteos);
		return d;
	},
	conv4disp : function(d) {
		d.limit = cmn.num2st(d.limit);
		d.when = cmn.ui82st(d.when);
		d.disposal = cmn.ui82st(d.disposal);
		d.type = cmn.ui82st(d.type);
		d.taskid = cmn.num2st(d.taskid);
		d.extokenid = cmn.num2st(d.extokenid);
		d.reftoken = cmn.num2st(d.reftoken);
		d.rcalctype = cmn.ui82st(d.rcalctype);
		d.nofdesttoken = cmn.num2st(d.nofdesttoken);
		if (d.nofdesteos) {
			d.nofdesteos /= 10000;
		}
		d.nofdesteos = cmn.num2st(d.nofdesteos);
		return d;
	},

	add : async function(d) {
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
			await cmn.waitcommit(d);
			return {}
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	use : async function(d) {
		try {
			d = await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'tkuse',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
			return {}
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	request_payment : async function(d) {
		try {
			d.tokenid = cmn.st2num(d.tokenid);
			d.quantity = cmn.st2num(d.quantity);
			await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'tkreqpay',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
			return {};
		} catch (e) {
			return cmn.parseEosError(e);
		}

	},

	list : async function(d) {
		try {
			if (!cmn.isString(d.tkname)) {
				return {code:'INVALID_PARAM'};
			}
			const data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token',
				limit : -1,
			});
			let ret = [];
			data.forEach( v=> {
				if (v.tkname.includes(d.tkname)) {
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
				if (d.list.includes(v.tokenid)) {
					ret.push(v);
				}
			});
			return this.conv4disp(ret);
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},

	get_issued_data : async function(d) {
		try {
			const token = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token',
			}, d.tokenid);
			const issue = await eos.getDataWithSubKey({
				code : 'myphersystem',
				scope : d.tokenid,
				table : 'issued',
			}, 2, 'i64', d.personid, d.personid + 1);
			return {
				token : (token.length===1) ? this.conv4disp(token[0]) : {},
				issue : (issue.length>0) ? issue[0] : {}
			};
		} catch (e) {
			return cmn.parseEosError(e);
		}

	},

	list_for_person : async function(d) {
		try {
			let min = cmn.number_null;
			let max = 0;
			d.list.forEach(v => {
				v = parseInt(v);
				if (isNaN(v)||v===cmn.NUMBER_NULL) return;
				min = (min<v) ? min : v;
				max = (max>v) ? max : v;
			});
			const data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'token',
				limit : -1,
				lower_bound : min,
				upper_bound : max + 1,
			});
			let ret = [];
			for (let i in data) {
				const v  = data[i];
				const idata = await eos.getDataWithSubKey({
					code : 'myphersystem',
					scope : v.tokenid,
					table : 'issued',
				}, 2, 'i64', d.personid, d.personid + 1);
				//const d = cipher.getFormalFromCipherID({cipherid:v.issuer});
				const pdata = await eos.getData({
					code : 'myphersystem',
					scope : 'myphersystem',
					table : 'cformal',
					limit : 1,
					lower_bound : v.issuer,
				});
				let issuer = {};
				if (pdata.length===1) {
					issuer = pdata[0];
				}
				if (!idata) continue;
				idata.forEach(issued=> {
					ret.push({
						tokenid : v.tokenid,
						issuer : issuer,
						tkname : v.tkname,
						quantity : issued.quantity,
						status : issued.status,
						payinf : issued.payinf,
					});
				});
			}
			return ret;
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},

	update : async function(d) {
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
			await cmn.waitcommit(ret);
			const cdata = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'cdraft',
			}, d.cdraftid);
			let ret = -1;
			cdata[0].tokenlist.some(v=> {
				if (v===parseInt(d.tokenid)) {
					ret = d.tokenid;
					return true;
				}
				// search the latest id
				ret = (ret>v) ? ret : v;
			});
			return ret;
		} catch (e) {
			log.error(e);
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
			}, d.tokenid);
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
				limit : -1,
			});
			let ret = [];
			data.forEach(v => {
				if (String(v.tokenid).includes(n) || v.tkname.includes(n)) {
					ret.push({
						tokenid : v.tokenid,
						tkname : v.tkname,
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
				limit : -1,
			});
			let ret = [];
			n = parseInt(n);
			data.forEach(v => {
				if (v.issuer === n) {
					ret.push({
						tokenid : v.tokenid,
						tkname : v.tkname,
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
				limit : -1,
				lower_bound : min,
				upper_bound : max + 1,
			});
			data.forEach(v => {
				ret.push({
					tokenid : v.tokenid,
					tkname : v.tkname,
				});
			});
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
};
