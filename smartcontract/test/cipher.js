// Copyright (C) 2018-2019 The Mypher Authors
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
	describe('cnew', () => {
		const N = 'cnew';
		const _P = p => {
			let ret = {
				sender : 'mypherutest1',
				name : 'test111',
				editors : ['mypherutest1', 'mypherutest2'],
				tags : ['aaa', 'えい'],
				hash : '',
				multisig : 'multisigacnt',
				nofapproval : 2,
				approvers : ['mypherutest1', 'mypherutest2']
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
		it('"editors" is not set',  async () => {
			const ret = await tools.push(N, _P({editors:[]}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "multisig"',  async () => {
			const ret = await tools.push(N, _P({multisig:'multisigaaaa'}));
			assert.equal(ret,tools.message(21));
		});
		it('invalid "editors"',  async () => {
			let ret = await tools.push(N, _P({editors:['mypherutest1', 'mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({editors:['a', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({editors:['mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
		});
		it('"approvers" is not set',  async () => {
			const ret = await tools.push(N, _P({approvers:[]}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "approvers"',  async () => {
			let ret = await tools.push(N, _P({approvers:['mypherutest1', 'mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['a', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
		});
		it('"nofapproval" is 0',  async () => {
			const ret = await tools.push(N, _P({nofapproval:0}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "nofapproval"',  async () => {
			let ret = await tools.push(N, _P({nofapproval:3}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({nofapproval:2}));
			tools.checkIfSent(ret);
			ret = await tools.push(N, _P({nofapproval:1}));
			tools.checkIfSent(ret);
		});
		it('check if the data is correctly generated', async () => {
			const expect1 = {
				cipherid : 0,
				cdraftid : 0,
				name : 'test111',
				tags : ['aaa', 'えい']
			};
			const expect2 = {
				cdraftid : 0,
				version : 1,
				no : 1,
				formal : 1,
				name : 'test111',
				tags : ['aaa', 'えい'],
				editors : ['mypherutest1', 'mypherutest2'],
				hash : '',
				nofapproval : 2,
				approvers : ['mypherutest1', 'mypherutest2'],
				approved : [],
				tasklist : [],
				tokenlist : [] 
			};
			await tools.sleep(1000); // wait for generating block
			const formal = await tools.getHead({n:'cformal', c:2});
			assert.equal(tools.verify(formal[0],expect1), true);
			const draft = await tools.getHead({n:'cdraft',s:formal[0].cipherid, c:2});
			assert.equal(tools.verify(draft[0],expect2), true);
		});
	});
	describe('cnewdraft', () => {
		const N = 'cnewdraft';
		const _P = p => {
			let ret = {
				sender : 'mypherutest1',
				cipherid : 0,
				cdraftid : 0,
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid sender', async () => {
			const ret = await tools.push('cnewdraft', _P({sender:'test'}));
			tools.checkIfMissAuth(ret, 'test');
		});
		it('cipherid not found', async () => {
			const ret = await tools.push('cnewdraft', _P({cipherid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('draftid not found', async () => {
			const ret = await tools.push(N, _P({cdraftid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('check if data is correctly copied', async () => {
			const p = _P({});
			let ret = await tools.push(N, p);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.push(N, p);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:p.cipherid, c:2});
			tools.verify(draft[0], draft[1], ['cdraftid', 'version', 'editors', 'formal']);
			assert.equal(draft[1].cdraftid, 1);
			assert.equal(draft[1].version, 2);
			assert.equal(draft[1].formal, 0);
			assert.equal(draft[1].editors.length, 1);
			assert.equal(draft[1].editors[0], p.sender);
			tools.verify(draft[0], draft[2], ['cdraftid', 'no', 'version', 'editors', 'formal']);
			assert.equal(draft[2].cdraftid, 2);
			assert.equal(draft[2].version, 2);
			assert.equal(draft[2].no, 2);
			assert.equal(draft[2].formal, 0);
			assert.equal(draft[2].editors.length, 1);
			assert.equal(draft[2].editors[0], p.sender);
			console.log(JSON.stringify(draft));
		});
	});
	describe('cupdate', () => {
		const N = 'cupdate';
		const _P = p => {
			let ret = {
				cipherid : 0,
				cdraftid : 1,
				version : 2,
				no : 1,
				sender : 'mypherutest1',
				name : 'changed',
				editors : ['mypherutest1', 'mypherutest3'],
				tags : ['abc', '漢字', 'i'],
				hash : '',
				nofapproval : 2,
				approvers : ['mypherutest1', 'mypherutest2', 'mypherutest3'],
				tasklist : [],
				tokenlist : []
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid "sender"',  async () => {
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
		it('"editors" is not set',  async () => {
			const ret = await tools.push(N, _P({editors:[]}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "editors"',  async () => {
			let ret = await tools.push(N, _P({editors:['mypherutest1', 'mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({editors:['a', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({editors:['mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
		});
		it('"approvers" is not set',  async () => {
			const ret = await tools.push(N, _P({approvers:[]}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "approvers"',  async () => {
			let ret = await tools.push(N, _P({approvers:['mypherutest1', 'mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['a', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['mamamama', 'mypherutest2']}));
			assert.equal(ret,tools.message(2));
		});
		it('"nofapproval" is 0',  async () => {
			const ret = await tools.push(N, _P({nofapproval:0}));
			assert.equal(ret,tools.message(2));
		});
		it('invalid "nofapproval"',  async () => {
			let ret = await tools.push(N, _P({approvers:['mypherutest1', 'mypherutest2'], nofapproval:3}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['mypherutest1', 'mypherutest2'], nofapproval:2}));
			tools.checkIfSent(ret);
			ret = await tools.push(N, _P({nofapproval:2}));
			tools.checkIfSent(ret);
		});
		it('"name" is of invalid length',  async () => {
			let ret = await tools.push(N, _P({name:'12345'}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({name:''}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({name:'123456'}));
			tools.checkIfSent(ret);
		});
		it('"tasklist" has invalid task',  async () => {
			let ret = await tools.push(N, _P({tasklist:[1]}));
			assert.equal(ret,tools.message(2));
		});
		it('"tokenlist" has invalid token',  async () => {
			let ret = await tools.push(N, _P({tokenlist:[1]}));
			assert.equal(ret,tools.message(2));
		});
		it('check data',  async () => {
			// TODO:valid hash
			let p = _P({});
			let ret = await tools.push(N, p);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:p.cipherid, c:2});
			assert.equal(tools.verify(p, draft[1],['cipherid', 'sender', 'formal','approved']), true);
		});
	});
	describe('capprove', () => {
		const N = 'capprove';
		const _P = p => {
			let ret = {
				cipherid : 0,
				cdraftid : 1,
				sender : 'mypherutest3',
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('invalid "sender"',  async () => {
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
		it('sender is not approver',  async () => {
			assert.equal(await tools.connect(4), true);
			const ret = await tools.push(N, _P({sender:'mypherutest4'}));
			assert.equal(ret,tools.message(5));
		});
		it('cipherid not found',  async () => {
			assert.equal(await tools.connect(3), true);
			const ret = await tools.push(N, _P({cipherid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('cdraftid not found',  async () => {
			const ret = await tools.push(N, _P({cdraftid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('formal version',  async () => {
			const ret = await tools.push(N, _P({cdraftid:0}));
			assert.equal(ret,tools.message(3));
		});
		it('success',  async () => {
			let ret = await tools.push(N, _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:0, c:2});
			assert.equal(draft[1].approved.length, 1);
			assert.equal(draft[1].approved[0], 'mypherutest3');
		});
		it('already approved',  async () => {
			let ret = await tools.push(N, _P({}));
			assert.equal(ret,tools.message(6));
		});
		it('check if approved is cleared after updating',  async () => {
			let p = await tools.getHead({n:'cdraft',s:0, c:2});
			Object.assign(p[1],{cipherid:0, sender:'mypherutest3', name:'123456'}); 
			ret = await tools.push('cupdate', p[1]);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:0, c:2});
			assert.equal(draft[1].approved.length, 0);
		});
		it('reapprove',  async () => {
			let ret = await tools.push(N, _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:0, c:2});
			assert.equal(draft[1].approved.length, 1);
			assert.equal(draft[1].approved[0], 'mypherutest3');
		});
		it('fulfill the requirement of approval', async () => {
			assert.equal(await tools.connect(2), true);
			let ret = await tools.push(N, _P({'sender':'mypherutest2'}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:0, c:2});
			assert.equal(draft[1].approved.length, 2);
			assert.equal(draft[1].approved[1], 'mypherutest2');
			assert.equal(draft[1].formal, 1);
			assert.equal(draft[1].version, 2);
			const formal = await tools.getHead({n:'cformal',s:'myphersystem', c:2});
			assert.equal(formal[0].cdraftid, 1);
		});
		it('approve formaled version', async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N, _P({sender:'mypherutest1', cdraftid:2}));
			assert.equal(ret,tools.message(3));
		});
	});
	describe('crevapprove', () => {
		const N = 'crevapprove';
		const _P = p => {
			let ret = {
				cipherid : 0,
				cdraftid : 3,
				sender : 'mypherutest1',
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('preparation', async () => {
			let ret = await tools.push('cnewdraft', {sender:'mypherutest1', cipherid:0, cdraftid:1});
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('invalid "sender"',  async () => {
			const ret = await tools.push(N, _P({sender:'noname'}));
			tools.checkIfMissAuth(ret, 'noname');
		});
		it('cipherid not found',  async () => {
			const ret = await tools.push(N, _P({cipherid:10}));
			assert.equal(ret,tools.message(1));
		});
		it('already formal',  async () => {
			assert.equal(await tools.connect(2), true);
			const ret = await tools.push(N, _P({sender:'mypherutest2',cdraftid:1}));
			assert.equal(ret,tools.message(3));
		});
		it('sender is not approver',  async () => {
			assert.equal(await tools.connect(4), true);
			const ret = await tools.push(N, _P({sender:'mypherutest4'}));
			assert.equal(ret,tools.message(5));
		});
		it('sender does not approved yet',  async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N, _P({}));
			assert.equal(ret,tools.message(7));
		});
		it('success to reverse approval',  async () => {
			assert.equal(await tools.connect(1), true);
			let ret = await tools.push('capprove', _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.push(N, _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:'myphersystem', c:3});
			console.log(draft[2]);
		});
	});
}, true : () => {
	describe('just create the data which is of premise of next testing', () => {
		const _P = p => {
			let ret = {
				sender : 'mypherutest1',
				name : 'test111',
				editors : ['mypherutest1', 'mypherutest2'],
				tags : ['aaa', 'えい'],
				hash : '',
				multisig : 'multisigacnt',
				nofapproval : 2,
				approvers : ['mypherutest1', 'mypherutest2']
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('create data', async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push('cnew', _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('create a couple of draft', async () => {
			assert.equal(await tools.connect(1), true);
			let ret = await tools.push('cnewdraft', {sender:'mypherutest1', cipherid:0, cdraftid:0});
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.push('cnewdraft', {sender:'mypherutest1', cipherid:0, cdraftid:0});
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('approve a draft', async () => {
			let ret = await tools.push('capprove', {sender:'mypherutest1', cipherid:0, cdraftid:1}); 
			tools.checkIfSent(ret);
			assert.equal(await tools.connect(2), true);
			ret = await tools.push('capprove', {sender:'mypherutest2', cipherid:0, cdraftid:1}); 
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('create a new draft', async () => {
			assert.equal(await tools.connect(1), true);
			let ret = await tools.push('cnewdraft', {sender:'mypherutest1', cipherid:0, cdraftid:0});
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.push('cnewdraft', {sender:'mypherutest1', cipherid:0, cdraftid:1});
			tools.checkIfSent(ret);
		});
		it('output generated data', async () => {
			await tools.sleep(500);
			const draft = await tools.getHead({n:'cdraft',s:0, c:10});
			console.log(draft);
		});
	});
}
};

