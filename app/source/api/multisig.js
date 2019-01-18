// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.multisig');
const cmn = require('./cmn');
const fs = require('fs');

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
			const keys = genkey();
			// TODO:check if the below processes is needed
			// - wallet imports

			// unlock the default wallet
			let wkey = fs.readFileSync('/keys/wallet.txt', 'utf8');
			wkey = /"([^"]*)"/.exec(wkey);
			if (!wkey||wkey.length!==2) {
				log.error('wallet key not found');
				return {code:'INVALID_ENVIRONMENT'};
			}
			wkey = wkey[1];
			try {
				await cmn.cmd('cleos wallet unlock --password ' + wkey);
			} catch (e) {
				// don't raise error bacause above command returns an error 
				// if the wallet is already unlocked 
				log.debug(e);
			}
			await cmn.cmd('cleos wallet import --private-key ' + keys.prikey);
			// create account
			const unit = 'SYS';
			let line = [
				'cleos system newaccount',
				d.personid, '--transfer', d.id, keys.pubkey, 
				'--stake-net "1.0000', unit, '" --stake-cpu "1.0000', unit, 
				'" --buy-ram-kbytes 8'
			].join(' ');
			try {
				await cmn.cmd(line);
			} catch (e) {
				log.debug(e);
				if (e.includes('no balance object found')) {
					return {code:'INSUFFICIENT_FUNDS'};
				}
				if (e.includes('overdrawn balance')) {
					return {code:'INSUFFICIENT_FUNDS'};
				}
				return {code:'FAILED_TO_CREATE_ACCOUNT'};
			}
			const makeJson = type => {
				let json = {
					threshold : parseInt(d.threshold),
					keys : [],
					accounts : [],
					waits : []
				};
				d.coowner.sort((a, b) => {
					return (a>b) ? 1 : 0;
				});
				for ( let n in d.coowner ) {
					json.accounts.push({
						permission : {
							actor : d.coowner[n],
							permission : type
						},
						weight : 1
					});
				}
				return JSON.stringify(json);
			};
			// set the active permission
			line = [
				'cleos set account permission', d.id,
				'active',
				"'" + makeJson('active') + "'",
				'owner -p',
				d.id + '@owner'
			].join(' ');
			await cmn.cmd(line);
			// set the owner permisson
			line = [
				'cleos set account permission', d.id,
				'owner',
				"'" + makeJson('owner') + "'",
				'-p',
				d.id + '@owner'
			].join(' ');
			await cmn.cmd(line);
			// delete the temporary key from the wallet
			line = [
				'cleos wallet remove_key', keys.pubkey,
				'--private-key', wkey
			].join(' ');
			try {
				await cmn.cmd(line);
			} catch (e) {}
			return {};
		} catch (e) {
			return {code:e};
		}
	}
};