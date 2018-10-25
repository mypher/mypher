// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function Cipher(d) {
	this.mode = MODE.REF;
	this.data = {
		id : d.id
	};
	this.div = d.div;
}

Cipher.prototype = {
	save : function() {
	},
	
	get : async function() {
		let info = await Rpc.call(
			'cipher.get',
			[{id:this.data.id}]
		);
		this.data = info.data;
	},

	refresh : async function() {
		return 0;
	},

	draw : async function() {
		await this.get();
		await this.refresh();
	}
};
//# sourceURL=cipher.js
