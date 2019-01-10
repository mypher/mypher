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
					this.data = Util.getData(this.div, {});
					this.search();
				}
			}]
		});
		Util.setData(this.div, this.data);
	},

	save : function() {
	},

	draw : async function() {
		await this.search();
		await this.refresh();
	},

	search : async function() {
		const data = this.data;
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
		case '3':
			this.searchToken(data, data.type2);
			break;
		}
	},

	searchUser : async function(d, f) {
		try {
			const data = (f==='0') 
				? await Rpc.call('person.list_byname', [d.name])
				: await Rpc.call('person.list_bytag', [d.name]);
			const list = new List({
				div : $('#result'),
				type : MODE.REF,
				col : [
					{
						width : 4,
						label : _L('ID'),
						name : 'personid'
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
						name : sel.personid
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
			const data = (f==='0')
				? await Rpc.call('cipher.list', [{name:d.name}])
				: await Rpc.call('cipher.list_bytag', [{tag:d.name}]);
			const list = new List({
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
					const cipher = new Cipher({
						div : $('#main'),
						cipherid : sel.cipherid,
						cdraftid : sel.cdraftid
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
		try {
			const data = await Rpc.call('task.list', [{name:d.name}]);
			const list = new List({
				div : $('#result'),
				type : MODE.REF,
				col : [
					{
						width : 6,
						label : _L('NAME2'),
						name : 'name'
					},
					{
						width : 3,
						label : _L('OWNER'),
						name : 'owner'
					},
					{
						width : 3,
						label : _L('PIC'),
						name : 'pic'
					}
				]
			}, (code, sel) => {
				if (code===LIST_NOTIFY.DATA) {
					if (data&&data.length>0) {
						list.show(data);
					}
				} else if (code===LIST_NOTIFY.SELECT) {
					const task = new Task({
						div : $('#main'),
						cipherid : sel.cipherid,
						tdraftid : sel.tdraftid,
						editors : [], // only formalized tasks are shown on the list
						mode : MODE.REF
					});
					History.run(_L('TASK'), task);
				}
			});
		} catch (e) {
			UI.alert(_L('FAILED_TO_GET_DATA'));
			console.log(e);
		}
	},

	searchToken : async function(d, f) {
		try {
			const data = await Rpc.call('token.list', [{name:d.name}]);
			const list = new List({
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
						label : _L('ISSUER'),
						name : 'issuer'
					}
				]
			}, (code, sel) => {
				if (code===LIST_NOTIFY.DATA) {
					if (data&&data.length>0) {
						list.show(data);
					}
				} else if (code===LIST_NOTIFY.SELECT) {
					const token = new Token({
						div : $('#main'),
						id : sel.id,
						mode : MODE.REF
					});
					History.run(_L('TOKEN'), token);
				}
			});
		} catch (e) {
			UI.alert(_L('FAILED_TO_GET_DATA'));
			console.log(e);
		}
	},
};
//# sourceURL=search.js
