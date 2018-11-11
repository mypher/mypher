MODE = {
	NEW : 1,
	REF : 2,
	EDIT : 3,
	REF2 : 4
};

System = {
	loadModule : name => {
		if ($('head link[href="css/' + name + '.css"]').length===0) {
			$('head link:last').after('<link rel="stylesheet" href="css/' + name + '.css">');
			$.getScript({url : '/js/' + name + '.js', async : false });
		}
	}
};


Rpc = {
	SV_URL : '',
	getId : () => {
		return Math.floor( Math.random() * 0x8000000000000000 );
	},
	call : async (method, param) => {
		var data = {
			'jsonrpc':'2.0',
			'id':Rpc.getId(),
			'method':method,
			'params':param
		};
		var m = method.split('.');
		if (m[1][0]==='_') {
			if (UserManager.isLogin()) {
				data.auth = UserManager.getHash({data:JSON.stringify(param)});
			}
		}
		return Util.promise((resolve, reject) => {
			$.ajax({
				type: "POST",
				url: 'http://' + location.host,
				data: JSON.stringify(data),
				dataType: 'json',
				contentType: "application/json"
			}).then(ret => {
				if (ret.error) {
					reject(ret.error);
				} else {
					resolve(ret.result);
				}
			}, ret => {
				UI.alert(_L('ERROR_RAISED'));
			});
		});
	}
};

var UI = {
	alert : function(msg) {
		var l = _L(msg);
		var div = UI.popup(400, 150);
		div.text(l ? l : msg);
	},

	popup : function(w, h) {
		var ws = {
			w : $(window).width(),
			h : $(window).height()
		};
		var index = 1000 + $('.popup').length*2;
		ws.cx = ws.w / 2;
		ws.cy = ws.h / 2;
		w = (ws.w < w) ? ws.w : w;
		h = (ws.h < h) ? ws.h : h;
		var popup = $('<div>').css({
			width : w + 'px',
			height : h + 'px',
			left : ((ws.w-w)/2) + 'px',
			top : ((ws.h-h)/2) + 'px',
			position : 'fixed',
			'z-index' : index
		}).addClass('popup');
		var popupback = $('<div>').addClass('popupback').css({
			'z-index' : index -1
		}).click(function() {
			UI.closePopup();
		});
		$('body').append(popupback);
		$('body').append(popup);
		return popup;
	},

	closePopup : function() {
		var popup = $('.popup');
		var popupback = $('.popupback');
		if (popup.length>0) {
			$(popup[popup.length-1]).remove();
		}
		if (popupback.length>0) {
			$(popupback[popupback.length-1]).remove();
		}
	},

	table : function(cls, hd, d) {
		let tb = $('<table>').append($('<thead><tr></tr></thead>'));
		let head = tb.find('tr:eq(0)');
		hd.forEach(elm => {
			head.append($('<th><div>' + elm + '</div></th>'));
		});
		d.forEach(row => {
			let r = $('<tr>');
			row.forEach(col => {
				let c = $('<td>');
				if (Util.isElm(col)) {
					c.append(col);
				} else {
					c.html(col);
				}
				r.append(c);
			});
			tb.append(r);
		});
		return tb.addClass(cls);
	}
};

let Util = {
	// TODO:localize format
	svTime2Local : function(d) {
		var padZero = function(v) {
			return (v<10) ? '0'+v : v;
		};
		try {
			var psd = /([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/.exec(d);
			var t = [psd[1], '/', psd[2], '/', psd[3], ' ', psd[4], ':', psd[5], ':', psd[6]].join('');
			var d = new Date(t);
			d.setTime(d.getTime()-(d.getTimezoneOffset()*60*1000));
			return [padZero(d.getFullYear()), '/', padZero(d.getMonth()+1), '/', 
					padZero(d.getDate()), ' ', padZero(d.getHours()), ':', 
					padZero(d.getMinutes()), ':', padZero(d.getSeconds())].join('');
		} catch (e) {
		}
		return '';
	},
	sanitize : function(t) {
		let ret = jQuery('<span/>').text(t).html();
		return ret.replace(/¥n/mg, '<br>');
	},
	N : {
	},
	getLocale : function() {
		return navigator.language;
	},
	name : async function(ids) {
		let req = [];
		let ret = {};
		if (ids instanceof Array && ids.length > 0) {
			ids.forEach(id => {
				if (id==='') return;
				if (Util.N[id]) {
					ret[id] = Util.N[id];
				} else {
					req.push(id);
					ret[id] = id;
				}
			});
			if (req.length===0) {
				return ret;
			}
			let names = await Rpc.call('person.getName', [req]);
			if (names.code===undefined) {
				names.forEach(elm => {
					ret[elm.id] = elm.name;
					Util.N[elm.id] = elm.name;
				});
			}
		}
		return ret;
	}, 
	wait_default : 2000,
	promise : function(func, timeout) {
		if (timeout===undefined) timeout = Util.wait_default;
		return new Promise(function(resolve, reject) {
			window.setTimeout(function() {
				reject('timeout');
			}, timeout);
			func(resolve, reject);
		});
	},
	text : function(text) {

	},
	split : function(v) {
		if (typeof(v)!=='string') {
			return [];
		}
		var ret = v.split(',');
		for ( var i in ret ) {
			ret[i] = ret[i].trim();
		}
		return ret;
	},
	load : async (div, file, mode, btns) => {
		div.empty();
		return Util.promise(function(resolve, reject) {
			div.load(file, function(res, status) {
				if (status==='error') {
					reject();
					return;
				}
				div.find('*[disable_on]').prop('disabled', false);
				div.find("*[hide_on]").css('display', '');
				switch (mode) {
				case MODE.NEW:
					div.find('*[disable_on*=add]').prop('disabled', true);
					div.find("*[hide_on*=add]").css('display', 'none');
					break;
				case MODE.EDIT:
					div.find('*[disable_on*=edit]').prop('disabled', true);
					div.find('*[hide_on*=edit]').css('display', 'none');
					break;
				case MODE.REF:
					div.find('*[disable_on*=ref]').prop('disabled', true);
					div.find('*[hide_on*=ref]').css('display', 'none');
					break;
				case MODE.REF2:
					div.find('*[disable_on*=rf2]').prop('disabled', true);
					div.find('*[hide_on*=rf2]').css('display', 'none');
					break;
				}
				var l = div.find('*[ltext]');
				for ( var i=0; i<l.length; i++ ) {
					var elm = l.eq(i);
					elm.text(_L(elm.attr('ltext')));
				}
				l = div.find('div[proc]');
				for ( var i=0; i<l.length; i++ ) {
					let elm = l.eq(i);
					let type = elm.attr('ctrl');
					switch (type) {
					case 'tag':
						Util.initTag(elm, mode, btns[elm.attr('proc')]);
						break;
					case 'user':
						Util.initUserList(elm, mode, btns[elm.attr('proc')]);
						break;
					case 'list':
						Util.initList(elm, mode, btns[elm.attr('proc')]);
						break;
					case 'date':
						Util.initDate(elm, mode, btns[elm.attr('proc')]);
						break;
					default:
						Util.initButton(elm.find('button'), btns[elm.attr('proc')]);
						break;
					}
				}
				l = div.find('select[proc]');
				for (var i=0; i<l.length; i++) {
					let elm = l.eq(i);
					elm.change(btns[elm.attr('proc')].change);
					
				}
				resolve();
			});
		});
	},
	initDate : function(elm, mode, arr) {
		const div = elm.get(0);
		div.obj = new DateCtrl(elm);
	},
	initButton : function(btns, arr) {
		var len = btns.length;
		var start = len - arr.length;
		for ( var i=0; i<start; i++ ) {
			btns.eq(i).css('display', 'none');
		}
		for ( var i=0; i<arr.length; i++) {
			var elm = btns.eq(start + i).css('display', '');
			if (arr[i].text) {
				elm.text(_L(arr[i].text));
			}
			if (arr[i].click) {
				elm.click(arr[i].click);
			}
		}
	},
	initTag : function(tag, mode, proc) {
		let elm = tag.get(0);
		elm.obj = new Tag(tag.eq(0), mode, proc);
	},
	initUserList : function(list, mode, proc) {
		let elm = list.get(0);
		elm.obj = new UserList(list.eq(0), mode, proc);
	},
	initList : function(list, mode, proc) {
		const elm = list.get(0);
		const data = {
			div : list.eq(0),
			type : mode,
			col : proc.col,
			key : proc.key
		};
		const cb = (code, d, list) => {
			if (code===LIST_NOTIFY.DATA) {
				if (proc.ondata) {
					return proc.ondata(d, list);
				}
			} else if (code===LIST_NOTIFY.SELECT) {
				if (proc.onselect) {
					return proc.onselect(d, list);
				}
			} else if (code===LIST_NOTIFY.CREATE) {
				if (proc.onadd) {
					return proc.onadd(d, list);
				}
			} else if (code===LIST_NOTIFY.GETDATA) {
				if (proc.ongetdata) {
					return proc.ongetdata(d, list);
				}
			}
		};
		elm.obj = new List(data, cb);
	},
	setData : function(div, d) {
		for ( var i in d ) {
			var dd = d[i];
			var elms = div.find('label[field=' + i + '],span[field=' + i + ']');
			if (elms.length>0) {
				elms.text(dd);
				continue;
			}
			elms = div.find('input[type="text"][field=' + i + ']');
			if (elms.length>0) {
				elms.val(dd);
				continue;
			}
			elms = div.find('textarea[field=' + i + ']');
			if (elms.length>0) {
				elms.val(dd);
				continue;
			}
			elms = div.find('*[subfield^=' + i + ']');
			if (elms.length>0) {
				for ( var i=0; i<elms.length; i++ ) {
					var elm = elms.eq(i);
					var val = elm.attr('subfield').split('=');
					if (val.length!==2) continue;
					elm.attr(val[1], dd);
				}
				continue;
			}
			elms = div.find('select[field=' + i + ']');
			if (elms.length>0) {
				elms.eq(0).val(dd).change();
				continue;
			}
			elms = div.find('div[field=' + i + ']');
			if (elms.length>0) {
				let ctrl = elms.eq(0).attr('ctrl');
				switch (ctrl) {
				case 'tag':
					elms.get(0).obj.set(dd);
					break;
				case 'user':
					elms.get(0).obj.set(dd);
					break;
				case 'list':
					elms.get(0).obj.set(dd);
					break;
				case 'date':
					elms.get(0).obj.setUTC(dd);
					break;
				}
				continue;
			}
			elms = div.find('input[type="radio"][field=' + i + ']');
			var dis = div.find('input[type="radio"][field=' + i + ']:disabled')
					.prop('disabled', false);
			try {
				for ( var i=0; i<elms.length; i++) {
					var r = elms.eq(i);
					if (parseInt(r.val())===parseInt(dd)) {
						r.click();
						break;
					}
				}
			} catch (e) {
				// nothing
			}
			dis.prop('disabled', true);
		}
	},
	getData : function(div, base) {
		let elms = div.find('[field]:not([type="radio"])');
		for ( let i=0; i<elms.length; i++ ) {
			const elm = elms.eq(i);
			const tagname = elm.prop('tagName');
			if (tagname==='LABEL') {
				base[elm.attr('field')] = elm.text();
			} else {
				const v = elm.attr('ctrl');
				const o = elm.get(0).obj;
				switch (v) {
				case 'tag':
				case 'user':
					if (o) base[elm.attr('field')] = o.get();
					break;
				case 'list':
					if (o) base[elm.attr('field')] = o.onget();
					break;
				case 'date':
					if (o) base[elm.attr('field')] = o.getUTC();
					break;
				default:
					base[elm.attr('field')] = elm.val();
				}
			}
		}
		// initialize fields
		elms = div.find('[field][type="radio"]');
		for ( let i=0; i<elms.length; i++ ) {
			const elm = elms.eq(i);
			base[elm.attr('field')] = '';
		}
		elms = div.find('.active [field][type="radio"]');
		for ( let i=0; i<elms.length; i++ ) {
			const elm = elms.eq(i);
			base[elm.attr('field')] = elm.val();
		}

		elms = div.find('*[subfield]');
		for ( let i=0; i<elms.length; i++ ) {
			const elm = elms.eq(i);
			const attr = elm.attr('subfield').split('=');
			if (attr.length!==2) continue;
			base[attr[1]] = elm.attr(attr[0])||'';
		}
		return base;
	},
	toInt : function(v, def) {
		try {
			return parseInt(v);
		} catch (e) {
			return def ? def : null;
		}
	},
	isElm : (obj) => {
		try {
			return obj instanceof HTMLElement;
		} catch (e) {
			return 	(typeof obj==="object") &&
					(obj.nodeType===1) && 
					(typeof obj.style === "object") &&
					(typeof obj.ownerDocument ==="object");
		}
	},
	padZero : (v, l) => {
		v = '00000000' + v;
		return v.substr(v.length-l, l);
	}
};


function Tag(div, mode, proc) {
	this.div = div;
	this.mode = mode;
	this.proc = proc&&proc.click;
	let self = this;
	div.click(() => {
		if (self.mode!==MODE.REF) {
			if (self.proc&&self.proc()===false) {
				return;
			}
			self.click();
		}
	});
	if (self.mode!==MODE.REF) {
		div.css('border', '1px dashed #30b0f0');
	}
	this.data = [];
}

Tag.prototype = {
	set : function(data) {
		if (data instanceof Array) {
			this.data = data;
		} else if ( typeof data === 'string' ) {
			this.data = [data];
		}
		this.div.empty();
		this.data.forEach((txt, idx) => {
			let elm = $('<div>').addClass('tag').text(txt).prop('idx', idx);
			this.div.append(elm);
			if (this.mode!==MODE.REF) {
				let self = this;
				elm.click(() => {
					this.data = this.data.filter((n,idx) => idx!==parseInt(elm.prop('idx')));
					this.set(this.data);
				});
			}
		});
	},
	get : function() {
		return this.data;
	},
	click : function() {
		let inp = this.div.find('input');
		if (inp.length>0) {
			inp.remove();
			return;
		}
		inp = $('<input type="text">').addClass('taginp').prop('size', 2);
		this.div.append(inp);
		let blur = () => {
			let val = inp.val();
			if (/^[ ]*$/.exec(val)) return;
			this.data.push(val);
			this.set(this.data);
		};
		inp.focus().blur(blur).keydown(v=> {
			if (v.keyCode===9) {
				blur();
				window.setTimeout(() => {
					this.click();
				}, 50);
				return false;
			} else if (v.keyCode===13) {
				blur();
				return false;
			}
			let val = inp.val();
			inp.prop('size', val.bytes()+2);
		});
	}
};

function UserList(div, mode, proc) {
	this.div = div;
	this.mode = mode;
	this.proc = proc&&proc.click;
	let self = this;
	div.click(() => {
		if (self.mode!==MODE.REF) {
			if (self.proc&&self.proc()===false) {
				return;
			}
			self.click();
		}
	});
	if (self.mode!==MODE.REF) {
		div.css('border', '1px dashed #30b0f0');
	}
	this.data = [];
}

UserList.prototype = {
	set : async function(data) {
		if (data instanceof Array) {
			this.data = data;
		} else if ( typeof data === 'string' ) {
			this.data = [data];
		}
		this.div.empty();
		let ret = {};
		try {
			ret = await Util.name(this.data);
		} catch (e) {}
		this.data.forEach(d => {
			let elm = $('<div>').addClass('userlist').text(ret[d]);
			this.div.append(elm);
		});
		return;
	},
	get : function() {
		return this.data;
	},
	click : function() {
		let inp = this.div.find('input');
		if (inp.length>0) {
			inp.remove();
			return;
		}
		inp = $('<input type="text">').addClass('taginp').prop('size', 2);
		this.div.append(inp);
		let blur = async () => {
			let val = inp.val();
			if (/^[ ]*$/.exec(val)) return;
			this.data.push(val);
			await this.set(this.data);
		};
		inp.focus().blur(blur).keydown(v=> {
			if (v.keyCode===9) {
				blur().then(() => {
					window.setTimeout(() => {
						this.click();
					}, 50);
				});
				return false;
			} else if (v.keyCode===13) {
				blur();
				return false;
			}
			let val = inp.val();
			inp.prop('size', val.bytes()+2);
		});
	}
};

String.prototype.bytes = function () {
	var length = 0;
	for (var i = 0; i < this.length; i++) {
		var c = this.charCodeAt(i);
		if ((c >= 0x0 && c < 0x81) || (c === 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) {
			length += 1;
		} else {
			length += 2;
		}
	}
	return length;
};

function DateCtrl(div) {
	this.id = div.attr('field');
	this.fmt = div.attr('format');
	const btn = $('<div class="input-group-append"></div>')
				.attr({ 'data-target' : '#' + this.id,
						'data-toggle' : 'datetimepicker' });
	div.addClass('input-group date').attr({'data-target-input': 'nearest', 'id':this.id})
		.append($('<input type="text" class="form-control datetimepicker-input"/>')
				.attr('data-target', '#' + this.id ))
		.append(btn);
	btn.append(
		$('<div class="input-group-text btn-normal"><img src="img/calendar.png"/></div>')
	);
	div.datetimepicker({locale : Util.getLocale(), format : this.fmt});
	this.val = null;
	const self = this;
	div.on('change.datetimepicker', function(e) {
		if (!e.date) return;
		let date = '';
		if (self.fmt==='L') {
			date = e.date.format('YYYYMMDD');
		} else {
			date = e.date.format('YYYYMMDDhhmmss');
		}
		self.setLocal(date, false);
	});
	this.div = div;
}

DateCtrl.prototype = {
	getLocal : function() {
		try {
			if (this.fmt==='L') {
				return this.formatL(
					this.val.getUTCFullYear(),
					this.val.getUTCMonth(),
					this.val.getUTCDate()
				);
			}
			return this.format(
				this.val.getFullYear(),
				this.val.getMonth(),
				this.val.getDate(),
				this.val.getHours(),
				this.val.getMinutes(),
				this.val.getSeconds()
			);
		} catch (e) {
			return '';
		}
	},

	getUTC : function() {
		try {
			if (this.fmt==='L') {
				return this.formatL(
					this.val.getUTCFullYear(),
					this.val.getUTCMonth(),
					this.val.getUTCDate()
				);
			}
			return this.format(
				this.val.getUTCFullYear(),
				this.val.getUTCMonth(),
				this.val.getUTCDate(),
				this.val.getUTCHours(),
				this.val.getUTCMinutes(),
				this.val.getUTCSeconds()
			);
		} catch (e) {
			return '';
		}
	},

	format : function(YYYY,MM,DD,hh,mm,ss) {
		return Util.padZero(YYYY,4) 
			 + Util.padZero(MM,2)
			 + Util.padZero(DD,2)
			 + Util.padZero(hh,2)
			 + Util.padZero(mm,2)
			 + Util.padZero(ss,2);
	},

	formatL : function(YYYY,MM,DD) {
		return Util.padZero(YYYY,4) 
			 + Util.padZero(MM,2)
			 + Util.padZero(DD,2);
	},

	setLocal : function(d, refresh) {
		let date;
		try {
			if (d.length===8) {
				date = new Date(
					parseInt(d.substr(0,4)),
					parseInt(d.substr(4,2))-1,
					parseInt(d.substr(6,2))
				);
			} else {
				date = new Date(
					parseInt(d.substr(0,4)),
					parseInt(d.substr(4,2))-1,
					parseInt(d.substr(6,2)),
					parseInt(d.substr(8,2)),
					parseInt(d.substr(10,2)),
					parseInt(d.substr(12,2))
				);
			}
			this.val = date;
		} catch (e) {
			this.val = null;
			date = '';
		}
		if (refresh!==false) {
			this.div.data('datetimepicker').date(date);
		}
	},

	setUTC : function(d, refresh) {
		let date;
		try {
			if (d.length===8) {
				date = new Date(
					parseInt(d.substr(0,4)),
					parseInt(d.substr(4,2))-1,
					parseInt(d.substr(6,2))
				);
			} else {
				date = new Date();
				date.setUTCFullYear(parseInt(d.substr(0,4)));
				date.setUTCMonth(parseInt(d.substr(4,2))-1);
				date.setUTCDate(parseInt(d.substr(6,2)));
				date.setUTCHours(parseInt(d.substr(8,2)));
				date.setUTCMinutes(parseInt(d.substr(10,2)));
				date.setUTCSeconds(parseInt(d.substr(12,2)));
			}
			this.val = date;
		} catch (e) {
			this.val = null;
			date = '';
		}
		if (refresh!==false) {
			this.div.data('datetimepicker').date(date);
		}
	},

	disabled : function(disable) {
		const inp = this.div.children('input');
		inp.prop('disabled', disable);
		if (disable) {
			inp.val('');
			this.div.find('div>div').addClass('btn-disabled');
		} else {
			this.div.find('div>div').removeClass('btn-disabled');
		}
	}
};

