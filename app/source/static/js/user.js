// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function User(d) {
	this.mode = MODE.REF;
	this.data = {
		id : d.name
	};
	this.div = d.div;
}

User.prototype = {
	getActiveKey : function(sys) {
		let ret = '';
		sys.permissions.some(v => {
			if (v.perm_name==='active') {
				if (v.required_auth.keys.length>0) {
					ret = v.required_auth.keys[0].key;
					return true;
				}
				return false;
			}
			return false;
		});
		return ret;
	},

	get : async function() {
		let info = await Rpc.call(
			'person.get',
			[{id:this.data.id}]
		);
		this.data = info.data||{id:this.data.id};
		this.data.pkey = this.getActiveKey(info.sys);
		this.data.sysdata = JSON.stringify(info.sys);
		Rpc.call(
			'person.get_desc',
			[this.data]
		).then(d => {
			for ( let k in d ) {
				this.data[k] = d[k];
			}
			this.refresh();
		});
	},

	update : async function() {
		let data = Util.getData(this.div, {});
		try {
			let ret = await Rpc.call(
				'person.update',
				[data]
			);
			this.data = data;
			this.mode = MODE.REF;
			this.refresh();
		} catch (e) {
			throw e;
		}
	},

	refresh : async function() {
		let btn = [];
		switch (this.mode) {
		case MODE.REF:
			if (Account.isLogin(this.data.id)) {
				btn.push({
					text : 'EDIT',
					click : () => {
						this.mode = MODE.EDIT;
						this.refresh();
					}
				});
			}
			btn.push({
				text : 'BACK',
				click : () => {
					History.back();
				}
			});
			break;
		case MODE.EDIT:
			btn.push({
				text : 'COMMIT',
				click : () => {
					this.update();
				}
			});
			btn.push({
				text : 'BACK',
				click : () => {
					History.back();
				}
			});
			break;
		}
		await Util.load(this.div, 'parts/user.html', this.mode, {
			button :btn,
			tags :[{
				click : function() {
					alert(1);
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
	}

};

//# sourceURL=user.js
