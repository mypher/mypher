// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('api.user');
let cmn = require('./cmn');
let ipfs = require('../db/ipfs');
let eos = require('../db/eos');

module.exports = {
	getName : async d => {
		try {
			let ret = [];
			for ( let i in d ) {
				if (!cmn.isEosID(d[i])) {
					return {code:'INVALID_PARAM'};
				}
				let data = await eos.getDataWithPKey({
					code : 'myphersystem',
					scope : 'myphersystem',
					table : 'person',
				}, d[i] );
				if (data!==null&&data.length>0&&d[i]===data[0].personid) {
					ret.push({id:d[i], name:data[0].name});
				}
			}
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);	
		}
	},

	get : async d => {
		try {
			if (!cmn.isEosID(d.id)) {
				return {code:'INVALID_PARAM'};
			}
			let ret = {};
			ret.data = await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'person',
			}, d.personid );
			if (ret.data!==null&&ret.data.length>0) {
				ret.data = ret.data[0];
			}
			ret.sys = await eos.getEosData(d.personid);
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);	
		}
	},
	get_desc : async d => {
		try {
			if (cmn.isEmpty(d.info)) {
				return {};
			}
			if (!cmn.isIpfsKey(d.info)) {
				return {code:'INVALID_PARAM'};
			}
			return await ipfs.get(d.info);
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	list : async d => {
		try {
			return await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'person',
			}, d.personid, 20 );
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
				table : 'person',
			}, 10000 );
			if (data.rows && data.rows instanceof Array) {
				let ret = [];
				data.rows.forEach(v=> {
					if (v.tags.includes(d)) {
						ret.push(v);
					}
				});
				return ret;
			}
			return [];
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	name : async d => {
		try {
			let min='', max = '';
			d.forEach(v => {
				if (min==='') {
					min = v;
				} else {
					min = (min>v) ? v : min;
				}
				if (max==='') {
					max = v;
				} else {
					max = (max<v) ? v : max;
				}
			});
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'person',
				limit : 0,
				lower_bound : min,
				upper_bound : max + 'a',
			});
			let ret = [];
			data.rows.forEach(v => {
				ret.push({
					personid : v.personid,
					name : v.name,
				});
			});
			return ret;
		} catch (e) {
			return cmn.parseEosError(e);
		}
	},
	list_byname : async n => {
		try {
			let data = await eos.getData({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'person',
				limit : 0,
			});
			let ret = [];
			data.rows.forEach(v => {
				if (v.personid.includes(n) || v.name.includes(n)) {
					ret.push({
						personid : v.personid,
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
	update : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.personid,   f:cmn.isEosID},
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.tags, f:cmn.isArray}
			])) {
				return {code:'INVALID_PARAM'};
			}

			let data = {
				personid : d.personid,
				name : d.name,
				tags : d.tags
			};
			if (cmn.isEmpty(d.desc)) {
				data.info = null;
			} else {
				let ret = await ipfs.add({desc:d.desc});
				data.info = ret[0].path;
			}
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : 'pupdate',
					authorization: [{
						actor: d.personid,
						permission: 'active',
					}],
					data,
				}]
			});
		} catch (e) {
			return cmn.parseEosError(e);
		}
	}
};