// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.multisig');
const cmn = require('./cmn');
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

	get_tran_list : async d => {
		try {
			const data = await eos.get_table_rows({
				code : 'eosio.msig',
				scope : d.account,
				table : 'proposal'
			});
			return data;
		} catch (e) {
			console.log(e);
			return cmn.parseEosError(e);
		}
	},

	get_tran_info : async d => {
		try {
			const data = await eos.getDataWithPKey({
				code : 'eosio.msig',
				scope : d.account[0],
				table : 'proposal'
			}, d.proposal_name);
			if (data===null||data.length===0) {
				return {};
			}
			const mstrans = await eos.deserializeTransaction(data[0].packed_transaction);
			if (mstrans) {
				data[0].tranasction = await Promise.all(mstrans.actions.map(async v => {
					if (v.data) {
						v.data =  await eos.deserializeActionData(v.account, v.name, v.data);
					}
					return v;
				}));
			}
			const data2 = await eos.getDataWithPKey({
				code : 'eosio.msig',
				scope : d.account[0],
				table : 'approvals'
			}, d.name);
			if (data2===null||data2.length===0) {
				return {code:'NOT_FOUND'};
			}
			data[0].approved = data2[0].provided_approvals.map(v => { return v.actor; });
			return data[0];
		} catch (e) {
			console.log(e);
			return {code:'INVALID_PARAM'};
		}
	},

	get_propose_data : async d => {
		try {
			const info = await eos.getAccount(d.multisig);
			d.req_perm = [];
			info.permissions.forEach(v => {
				if (v.perm_name==='active') {
					v.required_auth.accounts.forEach(v => {
						d.req_perm.push(v.permission);
					});
				}
			});
			let expiration =new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
			expiration = expiration.substring(0, expiration.length-1);
			const actions = await eos.serializeActions([
				{ 
					account: 'eosio.token', 
					name: 'transfer', 
					authorization: [ { actor: d.multisig, permission: 'active' } ], 
					data: {
						from : d.multisig, 
						to : d.sender, 
						quantity : d.quantity + ' SYS', 
						memo : d.memo, 
					}
				}
			]);
			return {
				account : 'eosio.msig',
				name : 'propose',
				authorization: [{
					actor: d.sender,
					permission: 'active',
				}],
				data : {
					proposer : d.sender,
					proposal_name : d.proposal_name,
					requested : d.req_perm,
					trx : {
						expiration, 
						ref_block_num: 0, 
						ref_block_prefix: 0, 
						max_net_usage_words: 0, 
						max_cpu_usage_ms: 0, 
						delay_sec: 0, 
						context_free_actions: [], 
						actions, 
						transaction_extensions: [] 
					}
				},
			};
		} catch (e) {
			console.log(e);
			return cmn.parseEosError(e);
		}
	},
	get_cancel_propose_data : async d => {
		return {
			account : 'eosio.msig',
			name : 'cancel',
			authorization: [{
				actor: d.sender,
				permission: 'active',
			}],
			data : {
				proposer : d.sender,
				proposal_name : d.proposal_name,
				canceler : d.sender,
			},
		};
	},
	cancel_propose : async d => {
		try {
			await eos.pushAction({
				actions :[{
					account : 'eosio.msig',
					name : 'cancel',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:{
						proposer : d.sender,
						proposal_name : d.proposal_name,
						canceler : d.sender,
					},
				}]
			});

		} catch (e) {
			console.log(e);
			return cmn.parseEosError(e);
		}
	},
	sign : async d => {
		try {
			await eos.pushAction({
				actions :[{
					account : 'eosio.msig',
					name : 'approve',
					authorization: [{
						actor: d.sender,
						permission: 'active',
					}],
					data:{
						proposer : d.proposer,
						proposal_name : d.proposal_name,
						level : {actor: d.sender, permission : 'active'},
					},
				}]
			});
			return {};
		} catch (e) {
			console.log(e);
			return cmn.parseEosError(e);
		}
	},
	get_execute_data : d => {
		return {
			account : 'eosio.msig',
			name : 'exec',
			authorization: [{
				actor: d.sender,
				permission: 'active',
			}],
			data:{
				proposer : d.sender,
				proposal_name : d.proposal_name,
				executer : d.sender,
			},
		};
	}
};