// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const log = require('../cmn/logger')('api.multisig');
const cmn = require('./cmn');
const fs = require('fs');

module.exports = {
	genkey : async function(d) {
		const pick = d => {
			const ret = /: ([a-zA-Z0-9]*)/.exec(d);
			if (ret===null||ret.length!==2) {
				return '';
			}
			return ret[1];
		};
		try {
			let ret = await cmn.cmd('cleos create key --to-console');
			ret = ret.split('\n');
			if (ret.length<=2) {
				return {code:'FAILED_TO_CREATE'};
			}
			return {
				pubkey : pick(ret[1]),
				prikey : pick(ret[0]),
			};
		} catch (e) {
			return {code:e};
		}
	},
	create : async function(d) {
		try {
			// check the patameters
			if (!cmn.chkTypes([
				{p:d.id,   f:cmn.isEosID},
				{p:d.threshold,   f:cmn.isNumber},
				{p:d.pubkey, f:cmn.isEmpty, r:true},
				{p:d.personid, f:cmn.isEmpty, r:true},
				{p:d.coowner, f:cmn.isArray}
			])) {
				return {code:'INVALID_PARAM'};
			}

			// unlock the default wallet
			let f = fs.readFileSync('/keys/wallet.txt', 'utf8');
			f = /"([^"]*)"/.exec(f);
			if (!f||f.length!==2) {
				log.error('wallet key not found');
				return {code:'INVALID_ENVIRONMENT'};
			}
			f = f[1];
			try {
				await cmn.cmd('cleos wallet unlock --password ' + f);
			} catch (e) {
				// don't raise error bacause above command returns an error 
				// if the wallet is already unlocked 
				log.debug(e);
			}
			// create account
			let line = [
				'cleos create account', d.personid, d.id, d.pubkey, d.pubkey
			].join(' ');
			ret = await cmn.cmd(line);
			if (ret.includes('Error')) {
				log.error(ret);
				return {code:'FAILED_TO_CREATE_ACCOUNT'};
			}
			const makeJson = type => {
				let json = {
					threshold : d.threshold,
					keys : [],
					accounts : [],
					waits : []
				};
				d.coowner.forEach(v => {
					json.accounts.push({
						permission : {
							actor : v,
							permisson : type
						},
						weight : 1
					});
				});
				return JSON.stringity(json);
			};
			// set the active permission
			line = [
				'cleos set account permission', d.id,
				'active',
				makeJson('active'),
				'owner -p',
				d.id + '@owner'
			].join(' ');
			ret = await cmn.cmd(line);
			if (ret.includes('Error')) {
				log.error(ret);
				return {code:'FAILED_TO_CREATE_ACCOUNT'};
			}
			// set the owner permisson
			line = [
				'cleos set account permission', d.id,
				'owner',
				makeJson('owner'),
				'-p',
				d.id + '@owner'
			].join(' ');
			ret = await cmn.cmd(line);
			if (ret.includes('Error')) {
				log.error(ret);
				return {code:'FAILED_TO_CREATE_ACCOUNT'};
			}
			return {};
		} catch (e) {
			return {code:e};
		}
	}
};