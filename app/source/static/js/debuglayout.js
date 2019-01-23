// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+

class DebugLayout extends View {

	constructor(d) {
		super();
		this.data = {
			name : d.name,
			mode : d.mode,
		};
	}

	async get() {
	}

	save() {
	}

	async set(data) {
	}

	async draw() {
		await Util.load($('#main'), 'parts/' + this.data.name + '.html', this.data.mode, {
		});
	}
};

DebugLayout.prototype.Validator = {
};

//# sourceURL=debuglayout.js
