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
	get : async d => {
		try {
			if (!cmn.isEosID(d.id)) {
				return {code:'INVALID_PARAM'};
			}
			let ret = {};
			ret.data = await eos.getDataByKey({
				code : 'mypher',
				scope : 'mypher',
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
			return await eos.getDataByKey({
				code : 'mypher',
				scope : 'mypher',
				table : 'person',
			}, d.id, 20 );
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
			return eos.pushAction({
				actions :[{
					account : 'mypher',
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