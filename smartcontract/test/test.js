// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const tools = require('./tools');
const assert = require('assert');
const cipher = require('./cipher');

describe('hooks', () => {

	before(async () => {
		await tools.initDocker();
	});

	after(() => {
	});

	beforeEach(() => {
	});

	afterEach(() => {
	});

	describe('Cipher', cipher);

});

