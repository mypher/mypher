// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const assert = require('assert');
const expect = require('expect.js');
const tools = require('./tools');

const _P = p => {
	let ret = {
		sender : 'test1',
		name : 'test111',
		editors : ['test1', 'test2'],
		tags : ['aaa', 'えい'],
		hash : '',
		nofapproval : 2,
		approvers : ['test1', 'test2']
	};
	Object.assign(ret, p);
	console.log(JSON.stringify(ret));
	return ret;
}

module.exports = () => {
	describe('cnew', () => {
		it('invalid "sender"',  async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push('cnew', _P({sender:'noname'}));
			assert.equal(ret,'missing authority of noname');
		});
		it('"editors" is not set',  async () => {
			const ret = await tools.push('cnew', _P({editors:[]}));
			assert.equal(ret,tools.message(37));
		});
		it('invalid "editors"',  async () => {
			let ret = await tools.push('cnew', _P({editors:['test1', 'mamamama', 'test2']}));
			assert.equal(ret,tools.message(37));
			ret = await tools.push('cnew', _P({editors:['a', 'test2']}));
			assert.equal(ret,tools.message(37));
			ret = await tools.push('cnew', _P({editors:['mamamama', 'test2']}));
			assert.equal(ret,tools.message(37));
		});
		it('"approvers" is not set',  async () => {
			const ret = await tools.push('cnew', _P({approvers:[]}));
			assert.equal(ret,tools.message(37));
		});
		it('invalid "approvers"',  async () => {
			let ret = await tools.push('cnew', _P({approvers:['test1', 'mamamama', 'test2']}));
			assert.equal(ret,tools.message(37));
			ret = await tools.push('cnew', _P({approvers:['a', 'test2']}));
			assert.equal(ret,tools.message(37));
			ret = await tools.push('cnew', _P({approvers:['mamamama', 'test2']}));
			assert.equal(ret,tools.message(37));
		});
		it('"nofapproval" is 0',  async () => {
			const ret = await tools.push('cnew', _P({nofapproval:0}));
			assert.equal(ret,tools.message(37));
		});
		it('invalid "nofapproval"',  async () => {
			let ret = await tools.push('cnew', _P({nofapproval:3}));
			assert.equal(ret,tools.message(37));
			ret = await tools.push('cnew', _P({nofapproval:2}));
			expect(ret).to.have.property('transaction_id');
			ret = await tools.push('cnew', _P({nofapproval:1}));
			expect(ret).to.have.property('transaction_id');
		});
	});
};
