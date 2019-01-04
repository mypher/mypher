// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'
const assert = require('assert');
const expect = require('expect.js');
const tools = require('./tools');

module.exports = {
false : () => {
	describe('preparation', () => {
		const N = 'cnewdraft';
		const _P = p => {
			let ret = {
				sender : 'test1',
				cipherid : 0,
				cdraftid : 3,
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('create new draft of cipher(expect:cdraftid->5)', async () => {
			assert.equal(await tools.connect(1), true);
			let ret = await tools.push(N, _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('output generated data', async() => {
			let ret = await tools.getHead({n:'cdraft', s:0, c:10});
			console.log(ret);
		});

	});
	describe('tknew', () => {
		const N = 'tknew';
		const _P = p => {
			let ret = {
					
				sender : 'test1', 
				cdraftid : 5,
				name : '1234567', 
				issuer : 0,
				limit : 10000, 
				when : 1,
				disposal : 1,
				type : 1, 
				taskid : 0xffffffff,
				extokenid : 0xffffffff, 
				reftoken : 0xffffffff,
				rcalctype : 0, 
				nofdesttoken : 0xffffffff, 
				nofdesteos : 0xffffffff,
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
	});
}, true : () => {
}
};
