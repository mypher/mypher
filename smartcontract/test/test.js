// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const assert = require('assert');
const cipher = require('./cipher');
const task = require('./task');
const token = require('./token');
const eos = require('./eos');

const pass_cipher = false;
const pass_task = true;
const pass_token = true;

describe('hooks', () => {

	before(async () => {
	});

	after(async () => {
	});

	beforeEach(() => {
	});

	afterEach(() => {
	});

	describe('Cipher', cipher[pass_cipher]);
	describe('Task', task[pass_task]);
	describe('Token', token[pass_token]);

});

