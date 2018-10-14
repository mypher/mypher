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
	get : async function() {
		let info = await Rpc.call(
			'user.get',
			[{user:this.data.id}]
		);
		this.data = {
			id : this.data.id,
			name : info.info.name,
			desc : info.info.desc,
			tags : info.info.tags
		};
		info.sys.permissions.forEach(elm => {
			
		});
	},

	refresh : async function() {
		let btn = [];
		let self = this;
		switch (this.mode) {
		case MODE.REF:
			if (Account.hasKey(this.getKey())) {
				btn.push({
					text : 'EDIT',
					click : () => {
						self.mode = MODE.EDIT;
						self.refresh();
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
		case MODE.NEW:
			break;
		case MODE.EDIT:
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
