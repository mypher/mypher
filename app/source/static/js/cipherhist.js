// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function CipherHist(d) {
	this.div = d.div;
	this.data = {
		cipherid : d.cipherid,
		formal : [],
		draft : [],
		history : []
	};
	this.cb = d.cb;
}

CipherHist.prototype = {
	get : async function() {
	},

	set : async function() {
	},

	save : async function() {
	},

	draw : async function() {
		await this.current();
		await this.refresh();
	},

	current : async function() {
		try {
			const list = await Rpc.call(
				'cipher.hist',
				[{cipherid:this.data.cipherid}]
			);
			this.data = {
				cipherid : this.data.cipherid,
				formal :[],
				draft : [],
				history : []
			}
			for (let i=list.length-1; i>=0; i--) {
				const o = list[i];
				if (this.data.formal.length===0) {
					if (o.formal) {
						this.data.formal.push(o);
					} else {
						this.data.draft.push(o);
					}
				} else {
					o.formal = o.formal ? '✓' : '';
					this.data.history.push(o);
				}
			}
		} catch (e) {
			UI.alert(e);
		}
	},

	refresh : async function() {
		const self = this;

		await Util.load(this.div, 'parts/cipherhist.html', MODE.REF, {
			current : {
				col : [
					{ width : 5, label : _L('VERSION'), name : 'version'},
					{ width : 7, label : _L('DRAFT_NO'), name : 'no'}
				],
				key : [],
				ondata : (d, list) => {
					list.show(this.data.formal);
				},
				onselect : this.cb
			},
			draft : {
				col : [
					{ width : 3, label : _L('VERSION'), name : 'version'},
					{ width : 3, label : _L('DRAFT_NO'), name : 'no'},
					{ width : 6, label : _L('EDITOR'), name : 'editors'}
				],
				key : [],
				ondata : (d, list) => {
					list.show(this.data.draft);
				},
				onselect : this.cb
			},
			history : {
				col : [
					{ width : 2, label : _L('VERSION'), name : 'version'},
					{ width : 2, label : _L('DRAFT_NO'), name : 'no'},
					{ width : 2, label : _L('FORMAL'), name : 'formal'},
					{ width : 6, label : _L('EDITOR'), name : 'editors'}
				],
				key : [],
				ondata : (d, list) => {
					list.show(this.data.history);
				},
				onselect : this.cb
			}
		});
	}
};

//# sourceURL=cipherhist.js
