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
					if (!data.type2) return;
					switch (data.type) {
					case '0':
						this.searchUser(data, data.type2);
						break;
					case '1':
						this.searchCipher(data, data.type2);
						break;
					case '2':
						this.searchTask(data, data.type2);
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

	searchUser : async function(d, f) {
		try {
			let data = (f==='0') 
				? await Rpc.call('person.list', [{id:d.name}])
				: await Rpc.call('person.list_bytag', [{tag:d.name}]);
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
						width : 4,
						label : _L('NAME2'),
						name : 'name'
					},
					{
						width : 4,
						label : _L('TAGS'),
						name : 'tags'
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

	searchCipher : async function(d, f) {
		try {
			let data = (f==='0')
				? await Rpc.call('cipher.list', [{name:d.name}])
				: await Rpc.call('cipher.list_bytag', [{tag:d.name}]);
			let list = new List({
				div : $('#result'),
				type : MODE.REF,
				col : [
					{
						width : 6,
						label : _L('NAME2'),
						name : 'name'
					},
					{
						width : 6,
						label : _L('TAGS'),
						name : 'tags'
					}
				]
			}, (code, sel) => {
				if (code===LIST_NOTIFY.DATA) {
					if (data&&data.length>0) {
						list.show(data);
					}
				} else if (code===LIST_NOTIFY.SELECT) {
					let cipher = new Cipher({
						div : $('#main'),
						id : sel.id
					});
					History.run(_L('CIPHER'), cipher);
				}
			});
		} catch (e) {
			UI.alert(_L('FAILED_TO_GET_DATA'));
			console.log(e);
		}
	},

	searchTask : async function(d, f) {
	}
};
//# sourceURL=search.js
