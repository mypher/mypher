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
				sender : 'mypherutest1',
				cipherid : 0,
				cdraftid : 3,
				name : 'testta',
				rewardid : 0xffffffff,
				quantity : 0xffffffff,
				nofapproval : 2,
				approvers : ['mypherutest1','mypherutest2','mypherutest3'],
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
			let ret = await tools.push(N, _P({approvers:['test', 'mypherutest1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['mypherutest1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['mypherutest1', 'test', 'mypherutest2', 'mypherutest3']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:[], nofapproval:0}));
			assert.equal(ret,tools.message(2));
		});
		it('"pic" is invalid', async () => {
			let ret = await tools.push(N, _P({pic:['test', 'mypherutest1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['mypherutest1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['mypherutest1', 'test', 'mypherutest2', 'mypherutest3']}));
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
				sender  : 'mypherutest1',
				cipherid  : 0,
				cdraftid : 3,
				tdraftid  : 0,
				name   : '1234567',
				rewardid : 0xffffffff,
				quantity : 0xffffffff,
				nofapproval : 1,
				approvers : ['mypherutest1', 'mypherutest3'],
				pic : ['mypherutest1', 'mypherutest3'],
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
			let ret = await tools.push(N, _P({approvers:['test', 'mypherutest1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['mypherutest1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:['mypherutest1', 'test', 'mypherutest2', 'mypherutest3']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({approvers:[], nofapproval:0}));
			assert.equal(ret,tools.message(2));
		});
		it('"pic" is invalid', async () => {
			let ret = await tools.push(N, _P({pic:['test', 'mypherutest1']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['mypherutest1', 'test']}));
			assert.equal(ret,tools.message(2));
			ret = await tools.push(N, _P({pic:['mypherutest1', 'test', 'mypherutest2', 'mypherutest3']}));
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
			let ret = await tools.push('cnewdraft', {sender:'mypherutest1', cipherid:0, cdraftid:3});
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
			assert.equal(cdraft[3].tasklist.length, 1);
			assert.equal(cdraft[3].tasklist[0], tdraft[1].tdraftid);
			assert.equal(cdraft[5].tasklist.length, 1);
			assert.equal(cdraft[5].tasklist[0], tdraft[0].tdraftid);
		});
		it('formal version can not be updated', async ()=> {
			assert.equal(await tools.connect(1), true);
			// approve the cipher
			let ret = await tools.push('capprove', {sender:'mypherutest1', cipherid:0, cdraftid:3}); 
			tools.checkIfSent(ret);
			await tools.sleep(500);
			assert.equal(await tools.connect(2), true);
			ret = await tools.push('capprove', {sender:'mypherutest2', cipherid:0, cdraftid:3}); 
			tools.checkIfSent(ret);
		});
		it('...continuation', async ()=> {
			await tools.sleep(500);
			ret = await tools.getHead({n:'tformal', s:'myphersystem', c:5});
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
				sender : 'mypherutest1',
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
			ret = await tools.getHead({n:'tformal', s:'myphersystem' , c:5});
			assert.equal(ret.length, 1);
			assert.equal(ret[0].approve_pic.length, 1);
			assert.equal(ret[0].approve_pic[0], 'mypherutest1');
		});
		it('duplicate approval', async () => {
			let ret = await tools.push(N, _P({}));
			assert.equal(ret,tools.message(6));
		});
		it('reverse an approval', async() => {
			let ret = await tools.push(N, _P({vec:false}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.getHead({n:'tformal', s:'myphersystem' , c:5});
			assert.equal(ret.length, 1);
			assert.equal(ret[0].approve_pic.length, 0);
		});
		it('an approval from a person is not approver', async () => {
			assert.equal(await tools.connect(4), true);
			let ret = await tools.push(N, _P({sender:'mypherutest4'}));
			assert.equal(ret,tools.message(5));
		});
		it('in review', async() => {
			// TODO:
		});
	});
	describe('taaprvrslt', async() => {
		const N = 'taaprvrslt';
		const _P = p => {
			let ret = {
				sender : 'mypherutest1',
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
		it('an approval from a person is not approver', async () => {
			assert.equal(await tools.connect(4), true);
			let ret = await tools.push(N, _P({sender:'mypherutest4'}));
			assert.equal(ret,tools.message(5));
		});
		it('pic is not approved yet', async () => {
			assert.equal(await tools.connect(1), true);
			let ret = await tools.push(N, _P({}));
			assert.equal(ret,tools.message(15));
		});
		it('prepare for next testing', async () => {
			let p = {
				sender : 'mypherutest1',
				tformalid : 0,
				vec : true
			};
			const n = 'taaprvpic';
			let ret = await tools.push(n, p);
			tools.checkIfSent(ret);
			await tools.sleep(500);
			assert.equal(await tools.connect(2), true);
			p.sender = 'mypherutest2';
			ret = await tools.push(n, p);
			tools.checkIfSent(ret);
		});
		it('...continuation', async () => {
			const p = {
				sender : 'mypherutest3',
				tformalid : 0,
				vec : true
			};
			assert.equal(await tools.connect(3), true);
			await tools.sleep(500);
			const n = 'taaprvpic';
			let ret = await tools.push(n, p);
			tools.checkIfSent(ret);
		});
		it('try to cancel the approval in the case that the task is not approved', async () => {
			await tools.sleep(500);
			assert.equal(await tools.connect(1), true);
			let ret = await tools.push(N, _P({vec:false}));
			assert.equal(ret,tools.message(7));
		});
		it('success to approve', async () => {
			let ret = await tools.push(N, _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.getHead({n:'tformal', s:'myphersystem' , c:5});
			assert.equal(ret.length, 1);
			assert.equal(ret[0].approve_results.length, 1);
		});
		it('try to cancel the approval for pic and cancel the approval for resutls', async () => {
			// try to cancel the approval for pic
			const p = {
				sender : 'mypherutest1',
				tformalid : 0,
				vec : false 
			};
			const n = 'taaprvpic';
			let ret = await tools.push(n, p);
			assert.equal(ret,tools.message(14));
			// cnacel the approval for results
			assert.equal(await tools.connect(1), true);
			ret = await tools.push(N, _P({vec:false}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			ret = await tools.getHead({n:'tformal', s:'myphersystem' , c:5});
			assert.equal(ret.length, 1);
			assert.equal(ret[0].approve_results.length, 0);
		});
		it('prepare for next testing which is in the case of completed task', async () => {
			ret = await tools.push(N, _P({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
			assert.equal(await tools.connect(2), true);
			ret = await tools.push(N, _P({sender:'mypherutest2'}));
			tools.checkIfSent(ret);
		});
		it('...continuation', async () => {
			await tools.sleep(500);
			ret = await tools.getHead({n:'tformal', s:'myphersystem' , c:5});
			assert.equal(ret.length, 1);
			assert.equal(ret[0].approve_results.length, 2);
			assert.equal(ret[0].approve_results[0], 'mypherutest1');
			assert.equal(ret[0].approve_results[1], 'mypherutest2');
		});
		it('cancel the approval in the case that the task is already approved ', async () => {
			assert.equal(await tools.connect(1), true);
			let ret = await tools.push(N, _P({vec:false}));
			assert.equal(ret,tools.message(16));
		});
	});
}, true : () => {
	describe('just create the data which is of premise of next testing', () => {
		const N_new = 'tanew';
		const P_new = p => {
			let ret = {
				sender : 'mypherutest1',
				cipherid : 0,
				cdraftid : 3,
				name : 'testta',
				rewardid : 0xffffffff,
				quantity : 0xffffffff,
				nofapproval : 2,
				approvers : ['mypherutest1','mypherutest2','mypherutest3'],
				pic : ['mypherutest3'],
				hash : '',
				tags : ['aaa','bbb'],
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		const N_pic = 'taaprvpic';
		const P_pic = p => {
			let ret = {
				sender : 'mypherutest1',
				tformalid : 0,
				vec : true
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		const N_rslt = 'taaprvrslt';
		const P_rslt = p => {
			let ret = {
				sender : 'mypherutest1',
				tformalid : 0,
				vec : true
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		const N_cipher = 'capprove';
		const P_cipher = p => {
			let ret = {
				sender  : 'mypherutest1',
				cipherid  : 0,
				cdraftid : 3,
			};
			Object.assign(ret, p);
			console.log(JSON.stringify(ret));
			return ret;
		};
		it('create task', async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N_new, P_new({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('formalize the cipher', async ()=> {
			let ret = await tools.push(N_cipher, P_cipher({})); 
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('...continuation', async ()=> {
			assert.equal(await tools.connect(2), true);
			ret = await tools.push(N_cipher, P_cipher({sender:'mypherutest2'}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('approve the pic by mypherutest1', async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N_pic, P_pic({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('approve the pic by mypherutest2', async () => {
			assert.equal(await tools.connect(2), true);
			const ret = await tools.push(N_pic, P_pic({sender:'mypherutest2'}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('approve the pic by mypherutest3', async () => {
			assert.equal(await tools.connect(3), true);
			const ret = await tools.push(N_pic, P_pic({sender:'mypherutest3'}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('approve results by mypherutest1', async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push(N_rslt, P_rslt({}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
		it('approve results by mypherutest2', async () => {
			assert.equal(await tools.connect(2), true);
			const ret = await tools.push(N_rslt, P_rslt({sender:'mypherutest2'}));
			tools.checkIfSent(ret);
			await tools.sleep(500);
		});
/*		it('output generated data', async() => {
			let ret = await tools.getHead({n:'tdraft', s:0 , c:5});
			console.log('■tdraft');
			console.log(ret);
			ret = await tools.getHead({n:'tformal', s:'myphersystem' , c:5});
			console.log('■tformal');
			console.log(ret);
		}); */
	});
}
};
