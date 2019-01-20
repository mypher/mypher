// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('db.eos');
const eosjs = require('eosjs');
const fetch = require('node-fetch');
const { TextDecoder, TextEncoder } = require('text-encoding'); 
const httpEndpoint = 'http://127.0.0.1:8888';
const rpc = new eosjs.Rpc.JsonRpc(httpEndpoint, { fetch });
const ecc = require('eosjs-ecc');

module.exports = {
	refresh : async function(keys) {
		// TODO:check if it is possible to get private key from wallet via jsonrpc call
		const signatureProvider = new eosjs.SignatureProvider(keys);
		this.api = new eosjs.Api({ rpc, signatureProvider, textDecoder: new TextDecoder, textEncoder: new TextEncoder });
	},

	pri2pub : key => {
		return ecc.privateToPublic(key);
	},

	pushAction : async function(d) {
		try {
			return await this.api.transact(d,{blocksBehind: 3, expireSeconds: 30});
		} catch (e) {
			throw e;
		}
	},

	getData : async function(d) {
		return await rpc.get_table_rows(d);
	},

	getDataWithPKey : async function(d, key, limit) {
		try {
			if (limit) d.limit = limit;
			else d.limit = 1;
			d.lower_bound = key;
			d.upper_bound = key + 1;
			let ret = await rpc.get_table_rows(d);
			if (ret.rows.length===0) {
				return null;
			}
			return ret.rows;
		} catch (e) {
			throw e;
		}
	},

	getTransaction : async function(id, blockid) {
		try {
			let ret = await rpc.history_get_transaction(id, blockid);
			return ret;
		} catch (e) {
			throw e;
		}
	},

	getDataWithSubKey : async function(d, kidx, ktype, min, max) {
		try {
			d.lower_bound = min;
			d.upper_bound = max;
			d.index_position = kidx;
			d.key_type = ktype;
			d.json = true;
			let path = '/v1/chain/get_table_rows';
			let ret = await rpc.fetch(path, d); 
			if (ret.rows.length===0) {
				return null;
			}
			return ret.rows;
		} catch (e) {
			throw e;
		}
	},

	getEosData : async function(name) {
		try {
			return await rpc.get_account(name);
		} catch (e) {
			throw e;
		}
	}
};
