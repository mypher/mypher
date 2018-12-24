// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const assert = require('assert');
const expect = require('expect.js');
const tools = require('./tools');
const eos = require('./eos');

module.exports = () => {
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
};
