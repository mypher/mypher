// Copyright (C) 2018 The Mypher Authors
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
		let list = await Rpc.call(
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
		this.data.list;
	},

	refresh : async function() {
		await Util.load(this.div, 'parts/cipherhist.html', MODE.REF, {
			current : {
				col : [
					{ width : 5, label : _L('VERSION'), name : 'version'},
					{ width : 7, label : _L('DRAFT_NO'), name : 'draftno'}
				],
				key : [],
				ondata : (d, list) => {
					list.show(this.data.formal);
				},
				onselect : (d, list) => {
					alert(d.id);
				}
			},
			draft : {
				col : [
					{ width : 3, label : _L('VERSION'), name : 'version'},
					{ width : 3, label : _L('DRAFT_NO'), name : 'draftno'},
					{ width : 6, label : _L('EDITOR'), name : 'editors'}
				],
				key : [],
				ondata : (d, list) => {
					list.show(this.data.draft);
				},
				onselect : (d, list) => {
					alert(d.id);
				}
			},
			history : {
				col : [
					{ width : 2, label : _L('VERSION'), name : 'version'},
					{ width : 2, label : _L('DRAFT_NO'), name : 'draftno'},
					{ width : 2, label : _L('FORMAL'), name : 'formal'},
					{ width : 6, label : _L('EDITOR'), name : 'editors'}
				],
				key : [],
				ondata : (d, list) => {
					list.show(this.data.history);
				},
				onselect : (d, list) => {
					alert(d.id);
				}
			},
			button : [{
				text : 'BACK',
				click : () => {
					History.back();
				}
			}]
		});
	}
};




//# sourceURL=cipherhist.js