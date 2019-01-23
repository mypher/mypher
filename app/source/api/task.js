// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.task');
const cmn = require('./cmn');
const eos = require('../db/eos');
const ipfs = require('../db/ipfs');

module.exports = {
	conv4store : function(d) {
		d.cipherid = cmn.st2num(d.cipherid);
		d.tdraftid = cmn.st2num(d.tdraftid);
		d.rewardid = cmn.st2num(d.rewardid);
		d.noftoken = cmn.st2num(d.noftoken);
		d.amount = cmn.st2float(d.amount);
		d.nofapproval = cmn.st2num(d.nofapproval);
		return d;		
	},
	conv4disp : function(d) {
		d.cipherid = cmn.num2st(d.cipherid);
		d.tdraftid = cmn.num2st(d.tdraftid);
		d.rewardid = cmn.num2st(d.rewardid);
		d.noftoken = cmn.num2st(d.noftoken);
		d.amount = cmn.num2st(d.amount);
		d.nofapproval = cmn.num2st(d.nofapproval);
		return d;		
	},

	add : async function(d) {
		try {
			d = this.conv4store(d);
		} catch (e) {
			throw {code:'INVALID_PARAM'};
		}
		let ret;
		try {
			ret = await ipfs.add({
				description : d.description
			});
			d.hash = ret[0].path;
		} catch (e) {
			log.error(e);
			return {code:e};
		}
		try {
			ret = await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'tanew',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
			await cmn.waitcommit(ret);
			return {};
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
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
				table : 'tformal',
				limit : -1,
			});
			let ret = [];
			data.rows.forEach( v=> {
				if (v.name.includes(d.name)) {
					ret.push(v);
				}
			});
			return ret;
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},
	list_bycipherid : async d => {
		try {
			const data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'tformal',
				limit : -1,
			});
			let ret = [];
			d = parseInt(d);
			data.rows.forEach( v=> {
				if (v.cipherid === d) {
					ret.push(v);
				}
			});
			return ret;
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},

	get : async function(d) {
		try {
			const tdraft = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : d.cipherid,
				table : 'tdraft'
			}, d.tdraftid);
			if (tdraft===null||tdraft.length===0) {
				return {code:'NOT_FOUND'};
			}
			const list = await eos.getDataWithSubKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'tformal'
			}, 2, 'i64', d.cipherid, d.cipherid+1);
			let tformal = null;
			for (let i in list) {
				if (list[i].tdraftid===parseInt(d.tdraftid)) {
					tformal = list[i];
					break;
				}
			}
			return {
				tdraft : this.conv4disp(tdraft[0]),
				tformal : tformal ? this.conv4disp(tformal) : null
			};
		} catch (e) {
			log.error(e);
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
			log.error(e);
			return {code:e};
		}
	},

	update : async function(d) {
		try {
			d = this.conv4store(d);
		} catch (e) {
			log.error(e);
			throw {code:'INVALID_PARAM'};
		}
		let ret;
		try {
			ret = await ipfs.add({
				description : d.description
			});
			d.hash = ret[0].path;
		} catch (e) {
			log.error(e);
			throw {code:e}
		}
		try {
			ret = await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'taupdate',
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
				scope : d.cipherid,
				table : 'cdraft',
			}, d.cdraftid);
			let ret = -1;
			cdata[0].tasklist.some(v=> {
				if (v===parseInt(d.id)) {
					ret = d.id;
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

	list_byname : async n => {
		try {
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'tformal',
				limit : -1,
			});
			let ret = [];
			data.rows.forEach(v => {
				if (String(v.tformalid).includes(n) || v.name.includes(n)) {
					ret.push({
						tformalid : v.tformalid,
						name : v.name,
						tags : v.tags
					});
				}
			});
			return ret;
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},

	list_for_cipher : async d => {
		try {
			const data = await eos.getData({
				code : 'myphersystem',
				scope : d.cipherid,
				table : 'tdraft',
				limit :-1 
			});
			let ret =[];
			data.rows.forEach(v => {
				if (d.list.includes(v.tdraftid)) {
					ret.push({
						tdraftid : v.tdraftid,
						name : v.name,
						tags : v.tags
					});
				}
			});
			return ret;
		} catch (e) {
			log.error(e);
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
			let data = await eos.getDataWithSubKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'tformal',
				lower_bound : d.cipherid,
				upper_bound : d.cipherid + 1,
			});
			let dd = [];
			d.forEach(v=> {
				dd.push(parseInt(v));
			});
			data.forEach(v => {
				if (dd.includes(v.tformalid)) {
					ret.push({
						tformalid : v.tformalid,
						name : v.name,
					});
				}
			});
			return ret;
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},

	approve_pic : async function(d) {
		try {
			d.vec = true;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'taaprvpic',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},
	cancel_approve_pic : async function(d) {
		try {
			d.vec = false;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'taaprvpic',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},
	approve_results : async function(d) {
		try {
			d.vec = true;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'taaprvrslt',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},
	cancel_approve_results : async function(d) {
		try {
			d.vec = false;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'taaprvrslt',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},
	apply_for_pic : async function(d) {
		try {
			d.vec = true;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'applyforpic',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},
	cancel_apply_for_pic : async function(d) {
		try {
			d.vec = false;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'applyforpic',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			log.error(e);
			return cmn.parseEosError(e);
		}
	},
};
