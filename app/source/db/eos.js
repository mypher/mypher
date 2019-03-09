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
const rpc = new eosjs.JsonRpc(httpEndpoint, { fetch });
const ecc = require('eosjs-ecc');
const JsSignatureProvider = require('eosjs/dist/eosjs-jssig').default;
const ser = require('eosjs/dist/eosjs-serialize');
const textEncoder = new TextEncoder;
const textDecoder = new TextDecoder;

module.exports = {
	refresh : async function(keys) {
		const api = this.api;
		// TODO:check if it is possible to get private key from wallet via jsonrpc call
		const signatureProvider = new JsSignatureProvider(keys);
		this.api = new eosjs.Api({ rpc, signatureProvider, textDecoder, textEncoder });
		return api;
	},

	json2hex : function(types, type, data) {
		let js2Type = eosjs.serialize.getType(types, type);
    	let buf = new eosjs.serialize.SerialBuffer({ textEncoder, textDecoder });
    	js2Type.serialize(buf, data);
    	return eosjs.serialize.arrayToHex(buf.asUint8Array());
	},

	serializeActions : async function(actions) {
		return await this.api.serializeActions(actions);
	},

	deserializeActionData : async function(account, name, data) {
		const contract = await this.api.getContract(account);
		return await ser.deserializeActionData(contract, account, name, data, textEncoder, textDecoder);
	},

	deserializeTransaction : async function(trans) {
		trans = ser.hexToUint8Array(trans);
		return await this.api.deserializeTransaction(trans);
	},

	setconn : function(api) {
		this.api = api;
	},

	pri2pub : key => {
		return ecc.privateToPublic(key);
	},

	pushAction : async function(d) {
		try {
			return await this.api.transact(d,{blocksBehind: 5, expireSeconds: 2000});
		} catch (e) {
			throw e;
		}
	},

	getAccount : async function(name) {
		try {
			return await rpc.get_account(name);
		} catch (e) {
			throw e;
		}
	},

	getData : async function(d) {
		const ret = await rpc.get_table_rows(d);
		if (ret && ret.rows instanceof Array) {
			return ret.rows;
		}
		return [];
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
