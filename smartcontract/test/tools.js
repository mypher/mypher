// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//
//

'use_strict'

const eos = require('./eos');
const assert = require('assert');
const expect = require('expect.js');

const connect = async d => {
	try {
		await eos.refresh([d.pass]);
		let data = await eos.getEosData(d.id);
		let pub = eos.pri2pub(d.pass);
		let found = false;
		data.permissions.some(d => {
			d.required_auth.keys.some(dd => {
				if (dd.key===pub) {
					found = true;
					return true;
				}
				return false;
			});
			return found;
		});
		return found;
	} catch (e) {
		return e.message;
	}
};


module.exports = {
	active : '',
	NN : 0xffffffff, // NUMBER_NULL
	connect : async function(d) {
		const acnt = [
			{},
			{ id : 'mypherutest1', pass : '5JUUfwj41YsaNjmiMEQdCyuCsXenxDdfCEuJLBng9985wfaf19V' },
			{ id : 'mypherutest2', pass : '5Hz1SxDgsKG9rA5wyoPCp9d59VEzoNhnNzzjbuJP5YgQDyvgEeQ' },
			{ id : 'mypherutest3', pass : '5JDR2gXH2fvecAzcaxK19Cqgivk8ojHNwWzAwArUHPszLgiVXSq' },
			{ id : 'mypherutest4', pass : '5J6wBifS6gy4Sx97mhudtuWfbJw6vbXdnBggdunw5i5ArbwPqev' }
		];
		this.active = acnt[d].id;
		return await connect(acnt[d]);
	},
	push : async function(n, d) {
		try {
			return await eos.pushAction({
				actions :[{
					account : 'myphersystem',
					name : n,
					authorization: [{
						actor: this.active,
						permission: 'active',
					}],
					data:d,
				}]
			});
		} catch (e) {
			return e.message;
		}
	},
	getByKey : async ({n,s,d}) => {
		try {
			if (s===undefined) s = 'myphersystem';
			const ret =  await eos.getDataWithPKey({
				code : 'myphersystem',
				scope : s,
				table : n,
			}, d );
			return ret.rows;
		} catch (e) {
			return e.message;
		}
	},
	getHead : async ({n,s,c}) => {
		try {
			if (s===undefined) s = 'myphersystem';
			const ret =  await eos.getData({
				code : 'myphersystem',
				scope : s,
				table : n,
			}, c );
			return ret.rows;
		} catch (e) {
			return e.message;
		}
	},
	message : c => {
		return 'assertion failure with error code: ' + c;
	},
	sleep : async time => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, time);
		});
	},
	verify : (o1, o2, ignore) => {
		let jo1 = Object.assign({}, o1);
		let jo2 = Object.assign({}, o2);
		const err = (o1, o2, n) => {
			if (JSON.stringify(o1[n])!==JSON.stringify(o2[n])) {
				console.log('member:' + n + ' is different from expected value');
				console.log('- target1');
				console.log(JSON.stringify(o1));
				console.log('- target2');
				console.log(JSON.stringify(o2));
				return true;
			}
			return false;
		}
		if (ignore) {
			ignore.forEach(v => {
				delete jo1[v];
				delete jo2[v];
			});
		}
		for (let i in jo1) {
			if (err(jo1, jo2, i)) {
				return false;
			}
		}
		for (let i in jo2) {
			if (err(jo1, jo2, i)) {
				return false;
			}
		}
		return true;
	},
	checkIfMissAuth : (o, n) => {
		assert.equal(o, 'missing authority of ' +n);
	},
	checkIfSent : o => {
		expect(o).to.have.property('transaction_id');
	}
};
