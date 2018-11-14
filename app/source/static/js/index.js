// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

_ = {
	init : () => {
		System.loadModule('header');
		System.loadModule('footer');
		System.loadModule('account');
		System.loadModule('user');
		System.loadModule('cipher');
		System.loadModule('search');
		System.loadModule('list');
		System.loadModule('cipherhist');
		System.loadModule('token');
		System.loadModule('task');
		Header.init($('#head')).then(() => {
			_.showSearch();
		});
		Footer.init($('#tail'));
	},
	showSearch : () => {
		let search = new Search({
			div : $('#main')
		});
		History.run(_L('SEARCH'), search);
	}
};

$(function() {
	_.init();
	$(window).on('popstate', function(event) {
	});
	$(window).scroll(function() {
		Footer.scroll();
	});
	$(window).resize(function() {
		Footer.scroll();
	});
});
//# sourceURL=index.js
