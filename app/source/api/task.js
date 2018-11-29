// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.task');
const cmn = require('./cmn');
const eos = require('../db/eos');
const ipfs = require('../db/ipfs');

module.exports = {
	formdata : function(d) {
		d.cipherid = parseInt(d.cipherid)||cmn.NUMBER_NULL;
		d.ruleid = parseInt(d.ruleid)||cmn.NUMBER_NULL;
		d.rewardid = parseInt(d.rewardid)||cmn.NUMBER_NULL;
		d.rquantity = parseInt(d.rquantity)||0;
		return d;		
	},

	add : async function(d) {
		try {
			if (!cmn.chkTypes([
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.description, f:cmn.isString},
				{p:d.rewardid, f:cmn.isStrNumber},
				{p:d.rquantity, f:cmn.isStrNumber},
				{p:d.pic, f:cmn.isArray},
			])) {
				return {code:'INVALID_PARAM'};
			}
			d = this.formdata(d);
		} catch (e) {
			throw {code:'INVALID_PARAM'};
		}

		try {
			const ret = await ipfs.add({
				description : d.description
			});
			d.hash = ret[0].path;
		} catch (e) {
			return {code:e};
		}
		try {
			return await eos.pushAction({
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

		} catch (e) {
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
				table : 'task',
			}, 10000);
			let ret = [];
			// TODO:create index
			data.rows.forEach( v=> {
				if (v.name.includes(d.name)) {
					ret.push(v);
				}
			});
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	list_bycipherid : async d => {
		try {
			const data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'task',
			}, 10000);
			let ret = [];
			d = parseInt(d);
			// TODO:create index
			data.rows.forEach( v=> {
				if (v.cipherid === d) {
					ret.push(v);
				}
			});
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	get : async d=> {
		try {
			let ret = {};
			ret = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'task'
			}, d.id);
			if (ret===null||ret.length===0) {
				return {code:'NOT_FOUND'};
			}
			ret = ret[0];
			ret.cipherid = cmn.id2st(ret.cipherid);
			ret.ruleid = cmn.id2st(ret.ruleid);
			ret.rewardid = cmn.id2st(ret.rewardid);
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	update : async function(d) {
		try {
			if (!cmn.chkTypes([
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.description, f:cmn.isString},
				{p:d.ruleid, f:cmn.isStrNumber},
				{p:d.rewardid, f:cmn.isStrNumber},
				{p:d.rquantity, f:cmn.isStrNumber},
				{p:d.pic, f:cmn.isArray},
			])) {
				return {code:'INVALID_PARAM'};
			}
			d = this.formdata(d);
		} catch (e) {
			throw {code:'INVALID_PARAM'};
		}

		try {
			const ret = await ipfs.add({
				description : d.description
			});
			d.hash = ret[0].path;
		} catch (e) {
			throw {code:e}
		}
		try {
			return await eos.pushAction({
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

		} catch (e) {
			return cmn.parseEosError(e);
		}
	},

	list_byname : async n => {
		try {
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'task',
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
				table : 'task',
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

	approve_task : async function(d) {
		try {
			d.vec = true;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'taaprvtask',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	cancel_approve_task : async function(d) {
		try {
			d.vec = false;
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'taaprvtask',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
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
			return cmn.parseEosError(e);
		}
	},
};