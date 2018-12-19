// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const assert = require('assert');
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
	return ret;
}

module.exports = () => {
	describe('cnew', () => {
		it('invalid "sender"',  async () => {
			assert.equal(await tools.connect(1), true);
			const ret = await tools.push('cnew', _P({sender:'noname'}));
			assert.equal(ret, 'missing authority of noname');
		});
		it('"editors" is not set',  async () => {
			const ret = await tools.push('cnew', _P({editors:[]}));
			assert.equal(ret, 'missing authority of noname');
		});
		it('invalid "editors"',  async () => {
			const ret = await tools.push('cnew', _P({editors:['test1', 'mamamama', 'test2']}));
			assert.equal(ret, 'missing authority of noname');
		});
	});
};
