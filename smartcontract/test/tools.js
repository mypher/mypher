// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//
//

'use_strict'

const eos = require('./eos');

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
	connect : async function(d) {
		const acnt = [
			{},
			{ id : 'test1', pass : '5JUUfwj41YsaNjmiMEQdCyuCsXenxDdfCEuJLBng9985wfaf19V' },
			{ id : 'test2', pass : '5Hz1SxDgsKG9rA5wyoPCp9d59VEzoNhnNzzjbuJP5YgQDyvgEeQ' },
			{ id : 'test3', pass : '5JDR2gXH2fvecAzcaxK19Cqgivk8ojHNwWzAwArUHPszLgiVXSq' },
			{ id : 'test4', pass : '5J6wBifS6gy4Sx97mhudtuWfbJw6vbXdnBggdunw5i5ArbwPqev' }
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
		if (ignore) {
			ignore.forEach(v => {
				delete o1[v];
				delete o2[v];
			});
		}
		const jo1 = JSON.stringify(o1);
		const jo2 = JSON.stringify(o2);
		if (jo1!==jo2) {
			console.log('- target1');
			console.log(JSON.stringify(o1));
			console.log('- target2');
			console.log(JSON.stringify(o2));
			return false;
		}
		return true;
	}
};
