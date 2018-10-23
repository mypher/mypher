// Copyright (C) 2018 The Mypher Authors
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

	getDataByKey : async function(d, key, limit) {
		try {
			if (limit) d.limit = limit;
			else d.limit = 1;
			d.lower_bound = key;
			let ret = await rpc.get_table_rows(d);
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
