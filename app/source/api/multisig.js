// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.multisig');
const cmn = require('./cmn');
const fs = require('fs');
const eos = require('../db/eos');

async function genkey() {
	const pick = d => {
		const ret = /: ([a-zA-Z0-9]*)/.exec(d);
		if (ret===null||ret.length!==2) {
			return '';
		}
		return ret[1];
	};
	let ret = await cmn.cmd('cleos create key --to-console');
	ret = ret.split('\n');
	if (ret.length<=2) {
		return {code:'FAILED_TO_CREATE'};
	}
	return {
		pubkey : pick(ret[1]),
		prikey : pick(ret[0]),
	};
} 

module.exports = {
	create : async function(d) {
		try {
			// check the patameters
			if (!cmn.chkTypes([
				{p:d.id,   f:cmn.isEosID},
				{p:d.threshold,   f:cmn.isNumber},
				{p:d.personid, f:cmn.isEmpty, r:true},
				{p:d.coowner, f:cmn.isArray}
			])) {
				return {code:'INVALID_PARAM'};
			}
			const keys = await genkey();

			// create account
			const unit = 'SYS';
			try {
				await eos.pushAction({
					actions :[{
						account : 'eosio',
						name : 'newaccount',
						authorization: [{
							actor: d.personid,
							permission: 'active',
						}],
						data:{
							creator : d.personid,
							name : d.id,
							owner: {
								threshold: 1,
								keys: [{ key: keys.pubkey, weight: 1 }],
								accounts: [],
								waits: []
							},
							active: {
								threshold: 1,
								keys: [{ key: keys.pubkey, weight: 1 }],
								accounts: [],
								waits: []
							},
						},
					},{
						account : 'eosio',
						name : 'buyrambytes',
						authorization: [{
							actor: d.personid,
							permission: 'active',
						}],
						data:{
							payer : d.personid,
							receiver : d.id,
							bytes : 8192,
						},
					},{
						account : 'eosio',
						name : 'delegatebw',
						authorization: [{
							actor: d.personid,
							permission: 'active',
						}],
						data:{
							from : d.personid,
							receiver : d.id,
							stake_net_quantity : '1.0000 ' + unit,
							stake_cpu_quantity : '1.0000 ' + unit,
							transfer : false,
						},
					}]
				});
			} catch (e) {
				log.debug(e);
				return {code:e};
			}

			let api;
			try {
				d.coowner.sort((a, b) => {
					return (a>b) ? 1 : 0;
				});
				 const makeAuth = type => {
					let auth = {
						threshold : parseInt(d.threshold),
						keys : [],
						accounts : [],
						waits : []
					};
					for ( let n in d.coowner ) {
						auth.accounts.push({
							permission : {
								actor : d.coowner[n],
								permission : type
							},
							weight : 1
						});
					}
					return auth;
				}
				api = await eos.refresh([keys.prikey]);
				await eos.pushAction({
					actions :[{
						account : 'eosio',
						name : 'updateauth',
						authorization: [{
							actor: d.id,
							permission: 'owner',
						}],
						data:{
							account : d.id,
							permission : 'active',
							parent : 'owner',
							auth : makeAuth('active')
						}
					},{
						account : 'eosio',
						name : 'updateauth',
						authorization: [{
							actor: d.id,
							permission: 'owner',
						}],
						data:{
							account : d.id,
							permission : 'owner',
							parent : '',
							auth : makeAuth('owner')
						}
					}]
				});
				eos.setconn(api);
			} catch (e) {
				if (api) {
					eos.setconn(api);
				}
				log.debug(e);
				return {code:e};
			}
			return {};
		} catch (e) {
			return {code:e};
		}
	},

	search : async d => {
		try {
			const data = await eos.getAccount(d.id);
			let v;
			const ret = {
				threshold : 0,
				coowner : [],
				id : d.id,
			};
			data.permissions.forEach(v => {
				if (v.perm_name==='active') {
					ret.threshold = v.required_auth.threshold;
					v.required_auth.accounts.forEach(v => {
						ret.coowner.push(v.permission.actor);
					});
				}
			});
			return ret;
		} catch (e) {
			console.log(e);
			return {code:'NOT_FOUND'};
		}
	},

	get_tran_info : async d => {
		try {
			const line = [
				'cleos multisig review',
				d.account, 
				d.name,
			].join(' ');
			const data = await cmn.cmd(line);
			console.log(data);
			return {};
		} catch (e) {
			console.log(e);
			return {code:'INVALID_PARAM'};
		}
	}
};
