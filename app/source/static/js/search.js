// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function Search(d) {
	this.mode = MODE.REF;
	this.data = {
		type:0
	};
	this.div = d.div;
}

Search.prototype = {

	get : async function() {
	},

	refresh : async function() {
		await Util.load(this.div, 'parts/search.html', this.mode, {
			search :[{
				click : () => {
					let data = Util.getData(this.div, {});
					switch (data.type) {
					case '0':
						this.searchUser(data);
						break;
					case '1':
						this.searchCipher(data);
						break;
					case '2':
						this.searchTask(data);
						break;
					}
				}
			}]
		});
		Util.setData(this.div, this.data);
	},

	save : function() {
	},

	draw : async function() {
		await this.get();
		await this.refresh();
	},

	searchUser : async function(d) {
		try {
			let data = await Rpc.call(
				'person.list',
				[{id:d.name}]
			);
			let list = new List({
				div : $('#result'),
				type : MODE.REF,
				col : [
					{
						width : 4,
						label : _L('ID'),
						name : 'id'
					},
					{
						width : 8,
						label : _L('NAME2'),
						name : 'name'
					}
				]
			}, (code, sel) => {
				if (code===LIST_NOTIFY.DATA) {
					if (data&&data.length>0) {
						list.show(data);
					}
				} else if (code===LIST_NOTIFY.SELECT) {
					let user = new User({
						div : $('#main'),
						name : sel.id
					});
					History.run(_L('USER'), user);
				}
			});
		} catch (e) {
			UI.alert(_L('FAILED_TO_GET_DATA'));
			console.log(e);
		}
	},

	searchCipher : async function(d) {
	},

	searchTask : async function(d) {
	}
};
//# sourceURL=search.js
