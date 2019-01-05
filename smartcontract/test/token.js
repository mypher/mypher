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
				when : 3,
				disposal : 1,
				type : 0, 
				taskid : tools.NN,
				extokenid : tools.NN, 
				reftoken : tools.NN,
				rcalctype : 0, 
				nofdesttoken : tools.NN, 
				nofdesteos : 1,
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid "sender"',  async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
		it('invalid "cdraftid"',  async () => {
			const ret = await tools.push(N, _P({cdraftid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('"cdraftid" is expired',  async () => {
			const ret = await tools.push(N, _P({cdraftid:2}));
			assert.equal(ret,tools.message(3));
		});
		it('invalid "issuer"', async () => {
			const ret = await tools.push(N, _P({issuer:1}));
			assert.equal(ret,tools.message(1));
		});
		it('invalid "when"', async () => {
			const ret = await tools.push(N, _P({when:5}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "disposal"', async () => {
			const ret = await tools.push(N, _P({disposal:2}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "type"', async () => {
			const ret = await tools.push(N, _P({type:4}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "taskid"', async () => {
			let ret = await tools.push(N, _P({taskid:10}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({when:1,taskid:10}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({when:1,taskid:tools.NN}));
			assert.equal(ret,tools.message(2));
		});
		it('valid "taskid"', async () => {
			let ret = await tools.push(N, _P({when:1, taskid:0}));
			const expect = {
				tokenid: 0,
				name: '1234567',
				issuer: 0,
				limit: 10000,
				when: 1,
				disposal: 1,
				type: 0,
				taskid: 0,
				extokenid: tools.NN,
				reftoken: tools.NN,
				rcalctype: 0,
				nofdesttoken: tools.NN,
				nofdesteos: '1.00000000000000000',
				approval_4ex: [] 
			};
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.getHead({n:'token', s:'myphersystem' , c:5});
			assert.equal(ret.length,1);
			assert.equal(tools.verify(ret[0],expect), true);
			ret = await tools.getHead({n:'cdraft', s:0 , c:10});
			assert.equal(ret.length,6);
			assert.equal(ret[5].tokenlist.length, 1);
			assert.equal(ret[5].tokenlist[0], 0);
		});
		it('check the consistency between "type", "extokenid" and "nofdesttoken"', async () => {
			let ret = await tools.push(N, _P({type:2, nofdesttoken:1}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({type:2, extokenid:0}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({type:2, extokenid:0, nofdesttoken:0}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({type:2, extokenid:0, nofdesttoken:1}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('check the consistency between "when", "extokenid" and "reftoken"', async () => {
			let ret = await tools.push(N, _P({when:2, reftoken:1}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({when:2, extokenid:0}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({when:2, extokenid:0, reftoken:0}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({when:2, extokenid:0, reftoken:1}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('check the consistency between "type" and "nofdesteos"', async () => {
			let ret = await tools.push(N, _P({type:3, nofdesteos:0}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({type:3, nofdesteos:0.01}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
	});
	describe('tkupdate', () => {
		const N = 'tkupdate';
		const _P = p => {
			let ret = {
				sender : 'test1', 
				cdraftid : 5,
				tokenid : 0,
				name : '1234567', 
				limit : 10000, 
				when : 3,
				disposal : 1,
				type : 0, 
				taskid : tools.NN,
				extokenid : tools.NN, 
				reftoken : tools.NN,
				rcalctype : 0, 
				nofdesttoken : tools.NN, 
				nofdesteos : 1,
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid "sender"',  async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
	});
}, true : () => {
}
};
