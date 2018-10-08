// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

_ = {
	init : () => {
		System.loadModule('header');
		System.loadModule('footer');
		System.loadModule('account');
		Header.init($('#head'));
		Footer.init($('#tail'));
		//UI.setMainDiv($('#main'));
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
