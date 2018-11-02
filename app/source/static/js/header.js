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
		var self = this;
		return Util.promise(function(resolve, reject) {
			self.div.load('parts/header.html', function(res, status) {
				if (status==='error') {
					reject();
				}
				var title = $(self.div.find('span[name="title"]')[0]);
				History.init(title);
				self.refresh();
				resolve();
			});
		});
	},

	refresh : function() {
		var ul = $(this.div.find('ul')[0]);
		var duser = $(this.div.find('div[name="user"]')[0]);
		var self = this;
		var addItem = (label, cb) => {
			var a = $('<a class="nav-link" href="#">');
			var li = $('<li class="nav-item">').append(a);
			a.text(label).click(function() {
				cb();
				var btn = self.div.find('button:eq(0)');
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
				for ( var i in this.data.menu ) {
					+ function() {
						var m = self.data.menu[i];
						addItem(m.text, function() {
							m.cb();
						});
					}();
				}
			}
		}
		addItem(_L('SEARCH'), function() {
			History.backTo(0);
		});
		//Account.logined = true;
		//Account.user = 'local';
		if (Account.logined) {
			addItem(_L('CREATE_CIPHER'), function() {
				let cipher = new Cipher({
					mode : MODE.NEW,
					div : $('#main')
				});
				History.run(_L('CIPHER'), cipher);
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
