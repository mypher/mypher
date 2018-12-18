// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const assert = require('assert');
const tools = require('./tools');

module.exports = () => {
	describe('cnew', () => {
		it('case1',  () => {
			assert.equal(tools.connect(1), true);
			const ret = tool.push('cnew', {
			});
			console.log(JSON.stringify(ret));
		});
	});
};
