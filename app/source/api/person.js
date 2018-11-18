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
				if (data!==null&&data.length>0&&d[i]===data[0].id) {
					ret.push({id:d[i], name:data[0].name});
				}
			}
			return ret;
		} catch (e) {
			throw e;	
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
			}, d.id );
			if (ret.data!==null&&ret.data.length>0) {
				ret.data = ret.data[0];
			}
			ret.sys = await eos.getEosData(d.id);
			return ret;
		} catch (e) {
			throw e;	
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
			throw e;
		}
	},
	list : async d => {
		try {
			return await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : 'myphersystem',
				table : 'person',
			}, d.id, 20 );
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
				table : 'person',
			}, 10000 );
			if (data.rows && data.rows instanceof Array) {
				let ret = [];
				data.rows.forEach(v=> {
					if (v.tags.includes(d.tag)) {
						ret.push(v);
					}
				});
				return ret;
			}
			return [];
		} catch (e) {
			throw e;
		}
	},
	listbyname : async d => {
		try {
			return [
				{key:'1',name:'test1'},
				{key:'2',name:'test2'},
				{key:'3',name:'test3'},
				{key:'4',name:'test4'},
				{key:'5',name:'test5'},
				{key:'6',name:'test6'},
				{key:'7',name:'test7'},
				{key:'8',name:'test8'},
			];
		} catch (e) {
			throw e;
		}
	},
	name : async l => {
		try {
			return [
				{key:'1',name:'test1'},
			];
		} catch (e) {
			throw e;
		}
	},
	update : async d => {
		try {
			if (!cmn.chkTypes([
				{p:d.id,   f:cmn.isEosID},
				{p:d.name, f:cmn.isEmpty, r:true},
				{p:d.tags, f:cmn.isArray}
			])) {
				return {code:'INVALID_PARAM'};
			}

			let data = {
				id : d.id,
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
						actor: d.id,
						permission: 'active',
					}],
					data,
				}]
			});
		} catch (e) {
			throw e;
		}
	}
};