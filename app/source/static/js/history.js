// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

// history.js

History = {
	hist : [],
	elm : null,

	init : function(elm) {
		this.elm = elm;
	},

	run : function(label, o) {
		if (this.hist.length>0) {
			var latest = this.hist[this.hist.length-1];
			latest.o.save();
		}
		this.hist.push({label:label, o:o});
		o.draw();
		this.breadcrumbs();
	},

	rerun : function() {
		var elm = this.hist[this.hist.length-1];
		elm.o.draw();
		this.breadcrumbs();
	},

	back : function() {
		this.hist.pop();
		this.rerun();
	},

	pop : function() {
		this.hist.pop();
		this.breadcrumbs();
	},

	backTo : function(no) {
		if (this.hist.length===0) return;
		if (this.hist.length<=no) return;
		this.hist = this.hist.splice(0,no+1);
		this.rerun();
	},

	overwrite : function(no, label, o) {
		no--;
		if (this.hist.length<=no) return;
		this.hist = this.hist.splice(0,no+1);
		this.run(label, o);
	},

	clear : function(d) {
		this.hist = [];
	},

	breadcrumbs : function() {
		var div = $('<div class="bc">');
		var self = this;
		for ( var i=0; i<self.hist.length; i++ ) {
			+ function() {
				var ii = i;
				var elm = self.hist[i];
				if (i<self.hist.length-1) {
					var a = $('<a href="#">').text(elm.label);
					a.click(function() {
						self.backTo(ii);
					});
					div.append(a);
					div.append($('<small>').text('»'));
				} else {
					div.append($('<span>').text(elm.label));
				}
			}();
		}
		self.elm.empty().append(div);
	}

};
/*	hist : [],

	push : function(label, cb) {
		if (this.hist.length>0) {
			this.hist[this.hist.length-1].cb = cb;
		}
		this.hist.push({label:label});
	},

	back : function() {
		var elm = this.hist.pop();
		elm.cb();
	},
	pop : function() {
		this.hist.pop();
	},

	backTo : function(no) {
		this.hist = this.hist.splice(0,no+1);
	},

	clear : function(d) {
		this.hist = [];
	},

	breadcrumbs : function() {
		var div = $('<div class="bc">');
		var self = this;
		for ( var i=0; i<this.hist.length; i++ ) {
			+ function() {
				var ii = i;
				var elm = self.hist[i];
				if (i<self.hist.length-1) {
					var a = $('<a href="#">').text(elm.label);
					a.click(function() {
						self.backTo(ii);
						elm.cb();
					});
					div.append(a);
					div.append($('<small>').text('»'));
				} else {
					div.append($('<span>').text(elm.label));
				}
			}();
		}
		return div;
	}
};*/

