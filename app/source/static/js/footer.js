// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

Footer = {
	HEIGHT : 40,
	init : async function(d) {
		this.div = d;
		return this.layout();
	},
	layout : async function() {
		var self = this;
		return Util.promise(function(resolve, reject) {
			self.div.load('parts/footer.html', function(res, status) {
				if (status==='error') {
					reject();
				}
				self.div.addClass('footer');
				resolve();
			});
		});
	},
	scroll : function() {
		var bottom = $(document).scrollTop() + $(window).height();
		var height = $(document).height();
		var h = this.HEIGHT - (height-bottom);
		h = (h<0) ? 0 : h;
		this.div.css('height', h + 'px');
	}
};
//# sourceURL=footer.js
