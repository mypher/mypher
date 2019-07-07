// Copyright (C) 2018-2019 The Mypher Authors
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
			addItem(_L('ACCOUNT'), function() {
				const user = new User({
					div : $('#main'),
					name : Account.user,
				});
				History.run(_L('ACCOUNT'), user);
			});
			addItem(_L('MULTISIG'), function() {
				const multisig = new MultiSig({
					div : $('#main'),
					personid : Account.user,
					mode : MODE.REF,
				});
				History.run(_L('MULTISIG'), multisig);
			});
		}
		addItem(_L(Account.logined ? 'LOGOUT' : 'LOGIN'), function() {
			Account.loginout();
		});
		// for debug 
//		addItem('login with testuser1111', () => {
//			Account.open({
//				name:'testuser1111', 
//				pass:'5KDtQbY3AfDUL6wRzGjfCrYSe3oQPamT2Wi5mqg742XMBELxp7r'
//			});
//		});
//		addItem('login with testuser2222', () => {
//			Account.open({
//				name:'testuser2222', 
//				pass:'5JNspGMzEipL9MSieWoUCESLoRvQ4wUm9SkJF2XVrKcZBHH4BH9'
//			});
//		});
//		addItem('login with testuser3333', () => {
//			Account.open({
//				name:'testuser3333', 
//				pass:'5JaZYVEicSB3HzUXy5tirJuxbaZAgyv5rwCZCWEGQnE11eg3ujG'
//			});
//		});
		addItem('login with gonzalez111', () => {
			Account.open({
				name:'gonzalez1111', 
				pass:'5JBmrLEt5kZgvVAYAC7X7msT9WzCuS3iHWVzXZtawQS3KTGwFki'
			});
		});
		addItem('login with vukovich1111', () => {
			Account.open({
				name:'vukovich1111', 
				pass:'5JBNkmQc8BWsk9LmuyQWrLfYiiAGiywUPzkeh6cuU6YoWZBoD1B'
			});
		});
		addItem('login with natalie11111', () => {
			Account.open({
				name:'natalie11111', 
				pass:'5KFo1utJrejhM5oCnK8YGF8TJEJLdsMs19XSgNAYArxeuv7XwuW'
			});
		});
		addItem('login with yoshio111111', () => {
			Account.open({
				name:'yoshio111111', 
				pass:'5JiwLBLBGa1TooLiPd7ti5aaVvNRwupfq5L2jKoxvWuYecXfGGV'
			});
		});
		addItem('login with daisuke11111', () => {
			Account.open({
				name:'daisuke11111', 
				pass:'5KiqDS9FpnsBqgw8sq2h4Vd8YxKLJZXZFhLs4wJeT9uypNTJNHM'
			});
		});
		addItem('login with yone11111111', () => {
			Account.open({
				name:'yone11111111', 
				pass:'5JthNxtybJecKerJ5RkWdzePEHzbcbekizTvLXpDVnVVJBYzNDJ'
			});
		});
		addItem('check the layout', () => {
			const task = new DebugLayout({
				name : 'cipher',
				mode : MODE.REF
			});
			History.run('check the layout', task);
		});
	},

	set : function(l) {
		this.data = l;
		this.refresh();
	}
};
//# sourceURL=header.js
