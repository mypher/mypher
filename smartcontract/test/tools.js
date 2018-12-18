// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//
//

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
		log.error(e.message)
		throw 'INVALID_ID_OR_PASS';
	}
};


moduke.exports = {
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
	}
};
