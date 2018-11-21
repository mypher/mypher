// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

Header = {
	init : async function(d) {
		this.div = d;
		return await this.layout();
	},

	layout : async function() {
		return Util.promise((resolve, reject) => {
			this.div.load('parts/header.html', (res, status) => {
				if (status==='error') {
					reject();
				}
				const title = $(this.div.find('span[name="title"]')[0]);
				History.init(title);
				this.refresh();
				resolve();
			});
		});
	},

	refresh : function() {
		const ul = $(this.div.find('ul')[0]);
		const duser = $(this.div.find('div[name="user"]')[0]);
		const addItem = (label, cb) => {
			const a = $('<a class="nav-link" href="#">');
			const li = $('<li class="nav-item">').append(a);
			a.text(label).click(() => {
				cb();
				const btn = this.div.find('button:eq(0)');
				if (btn.attr('aria-expanded')==='true') {
					btn.click();
				}
			});
			ul.append(li);
		};
		ul.empty();
		duser.empty();
		if (this.data) {
			if (this.data.menu) {
				this.data.menu.forEach( d=> {
					+ function() {
						addItem(d.text, function() {
							d.cb();
						});
					}();
				});
			}
		}
		addItem(_L('SEARCH'), function() {
			History.backTo(0);
		});
		if (Account.logined) {
			addItem(_L('CREATE_CIPHER'), function() {
				const cipher = new Cipher({
					mode : MODE.NEW,
					div : $('#main')
				});
				History.run(_L('CIPHER'), cipher);
			});
			addItem(_L('CREATE_TASK'), function() {
				const task = new Task({
					mode : MODE.NEW,
					div : $('#main')
				});
				History.run(_L('TASK'), task);
			});
			addItem(_L('CREATE_TOKEN'), function() {
				const token = new Token({
					mode : MODE.NEW,
					div : $('#main')
				});
				History.run(_L('TOKEN'), token);
			});
			addItem(_L('ACCOUNT'), function() {
				Account.ref();
			});
		}
		addItem(_L(Account.logined ? 'LOGOUT' : 'LOGIN'), function() {
			Account.loginout();
		});
	},

	set : function(l) {
		this.data = l;
		this.refresh();
	}
};
//# sourceURL=header.js
