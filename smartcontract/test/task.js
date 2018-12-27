// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const assert = require('assert');
const expect = require('expect.js');
const tools = require('./tools');
const eos = require('./eos');

module.exports = {
false : () => {

	// premise : 
	//  cipher : cipherid cdraftid version formal
	//             0       0         1      1
	//             0       1         2      1
	//             0       2         2      0
	//             0       3         3      0
	
	describe('tanew', () => {
		const N = 'tanew';
		const _P = p => {
			let ret = {
				sender : 'test1',
				cipherid : 0,
				cdraftid : 3,
				name : 'testta',
				rewardid : 0xffffffff,
				quantity : 0xffffffff,
				nofapproval : 2,
				approvers : ['test1','test2','test3'],
				pic : [],
				hash : '',
				tags : ['aaa','bbb'],
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid "sender"', async() => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
		it('cipherid not found',  async () => {
			const ret = await tools.push(N, _P({cipherid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('cdraftid not found',  async () => {
			const ret = await tools.push(N, _P({cdraftid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('specified cdraft is not draft version',  async () => {
			const ret = await tools.push(N, _P({cdraftid:2}));
			assert.equal(ret,tools.message(2));
		});
		it('name is of insufficient length',  async () => {
			const ret = await tools.push(N, _P({name:'12345'}));
			assert.equal(ret,tools.message(2));
		});
		it('"nofapproval" is more than number of approvers',  async () => {
			const ret = await tools.push(N, _P({nofapproval:4}));
			assert.equal(ret,tools.message(2));
		});
		it('"approvers" is invalid',  async () => {
			let ret = await tools.push(N, _P({approvers:['test', 'test1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['test1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['test1', 'test', 'test2', 'test3']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:[], nofapproval:0}));
			assert.equal(ret,tools.message(2));
		});
		it('"pic" is invalid', async () => {
			let ret = await tools.push(N, _P({pic:['test', 'test1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['test1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['test1', 'test', 'test2', 'test3']}));
			assert.equal(ret,tools.message(2));
		});
		it('"rewardid" is invalid', async () => {
			// TODO:
		});
		it('"hash" is invalid', async () => {
			// TODO:
		});
		it('check updated data', async ()=> {
			let p = _P({});
			let ret = await tools.push(N, p);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			let tdraft = await tools.getHead({n:'tdraft', s:p.cipherid, c:1});
			let cdraft = await tools.getHead({n:'cdraft', s:p.cipherid, c:4});
			tools.verify(p, tdraft[0], ['cipherid', 'tdraftid']);
			assert.equal(cdraft[3].tasklist.length, 1);
			assert.equal(cdraft[3].tasklist[0], tdraft[0].tdraftid);
		});
	});
	describe('taupdate', () => {
		const N = 'taupdate';
		const _P = p => {
			let ret = {
				sender  : 'test1',
				cipherid  : 0,
				cdraftid : 3,
				tdraftid  : 0,
				name   : '1234567',
				rewardid : 0xffffffff,
				quantity : 0xffffffff,
				nofapproval : 1,
				approvers : ['test1', 'test3'],
				pic : ['test4', 'test3'],
				hash : '',
				tags : ['aaa','ddd', 'eee'],
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid "sender"', async() => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
		it('cipherid not found',  async () => {
			const ret = await tools.push(N, _P({cipherid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('cdraftid not found',  async () => {
			const ret = await tools.push(N, _P({cdraftid:10}));
			assert.equal(ret,tools.message(2));
		});
		it('tdraftid not found',  async () => {
			const ret = await tools.push(N, _P({tdraftid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('already not draft', async() => {
			// TODO:
		});
		it('name is of insufficient length',  async () => {
			const ret = await tools.push(N, _P({name:'12345'}));
			assert.equal(ret,tools.message(2));
		});
		it('"nofapproval" is more than number of approvers',  async () => {
			const ret = await tools.push(N, _P({nofapproval:4}));
			assert.equal(ret,tools.message(2));
		});
		it('"approvers" is invalid',  async () => {
			let ret = await tools.push(N, _P({approvers:['test', 'test1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['test1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['test1', 'test', 'test2', 'test3']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:[], nofapproval:0}));
			assert.equal(ret,tools.message(2));
		});
		it('"pic" is invalid', async () => {
			let ret = await tools.push(N, _P({pic:['test', 'test1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['test1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['test1', 'test', 'test2', 'test3']}));
			assert.equal(ret,tools.message(2));
		});
		it('"rewardid" is invalid', async () => {
			// TODO:
		});
		it('"hash" is invalid', async () => {
			// TODO:
		});
		it('check updated task that is not shared', async ()=> {
			let p = _P({});
			let ret = await tools.push(N, p);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			let tdraft = await tools.getHead({n:'tdraft', s:p.cipherid, c:1});
			let cdraft = await tools.getHead({n:'cdraft', s:p.cipherid, c:4});
			tools.verify(p, tdraft[0], ['cipherid']);
			assert.equal(cdraft[3].tasklist.length, 1);
			assert.equal(cdraft[3].tasklist[0], tdraft[0].tdraftid);
		});
		it('check updated task that is shared', async ()=> {
			// share the cipher
			let ret = await tools.push('cnewdraft', {sender:'test1', cipherid:0, cdraftid:3});
			tools.checkIfSent(ret);
			await tools.sleep(500);
			let p = _P({});
			ret = await tools.push(N, p);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			let tdraft = await tools.getHead({n:'tdraft', s:p.cipherid, c:2});
			let cdraft = await tools.getHead({n:'cdraft', s:p.cipherid, c:6});
			assert.equal(tdraft.length, 2);
			tools.verify(p, tdraft[1], ['cipherid', 'tdraftid']);
			console.log(cdraft);
			assert.equal(cdraft[3].tasklist.length, 1);
			assert.equal(cdraft[3].tasklist[0], tdraft[1].tdraftid);
			assert.equal(cdraft[5].tasklist.length, 1);
			assert.equal(cdraft[5].tasklist[0], tdraft[0].tdraftid);
		});
		it('formal version can not be updated', async ()=> {
			assert.equal(await tools.connect(1), true);
			// approve the cipher
			let ret = await tools.push('capprove', {sender:'test1', cipherid:0, cdraftid:3}); 
			tools.checkIfSent(ret);
			await tools.sleep(500);
			assert.equal(await tools.connect(2), true);
			ret = await tools.push('capprove', {sender:'test2', cipherid:0, cdraftid:3}); 
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.getHead({n:'tformal', s:'myphersystem', c:5});
			console.log(ret);
			let p = _P({});
			ret = await tools.push(N, p);
			assert.equal(ret,tools.message(2));
		});

	});
	describe('taaprvpic', () => {
		// - only formal data can be applied the pic
		const N = 'taaprvpic';
		const _P = p => {
			let ret = {
				sender : 'test1',
				tformalid : 0,
				vec : true
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid "sender"', async() => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
		it('tformalid not found',  async () => {
			const ret = await tools.push(N, _P({tformalid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('older version', async () => {
			// TODO:
		});
		it('reverse to unapproved task', async () => {
			let ret = await tools.push(N, _P({vec:false}));
			assert.equal(ret,tools.message(7));
		});
		it('success to apply', async() => {
			let ret = await tools.push(N, _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.getHead({n:'tformal', s:0 , c:5});
			assert.equal(ret.length, 1);
			assert.equal(ret[0].approve_pic.length, 1);
			assert.equal(ret[0].approve_pic[0], 'test1');
			console.log(ret);
		});
	});

}, true : () => {
}
};
