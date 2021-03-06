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
					if (ret.result.code) {
						reject(_L(ret.result.code, ret.result.data));
					} else {
						resolve(ret.result);
					}
				}
			}, ret => {
				UI.alert(_L('ERROR_RAISED'));
			});
		});
	}
};

var UI = {
	alert : function(msg, data) {
		var l = _L(msg, data);
		l = l ? l : msg;
		if (msg.stack) {
			l = l + '\n' + msg.stack;
		}
		var div = UI.popup(400, 150);
		div.text(l);
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
					ret[elm.personid] = elm.name;
					Util.N[elm.personid] = elm.name;
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
		const makeAttrs = elm => {
			const attrs = {};
			for (let j=0; j<elm[0].attributes.length; j++) {
				const v = elm[0].attributes[j];
				if (v.name!=='hide_on') {
					attrs[v.name] = v.value;
				}
			}
			for (let v in attrs) {
				elm.removeAttr(v);
			}
			return attrs;
		};
		return Util.promise(function(resolve, reject) {
			div.load(file, function(res, status) {
				if (status==='error') {
					reject();
					return;
				}
				// make ctrl
				let l = div.find('div[formtype]');
				for (let i=0; i<l.length; i++) {
					const elm = l.eq(i);
					let e2 = null;
					const attrs = makeAttrs(elm);
					const slinner = $('<div/>').addClass('slinner');
					if (attrs['ltext']) {
						slinner.append(
							$('<div/>').addClass('label').text(_L(attrs['ltext']))
						);
					}
					elm.addClass(attrs['formtype']).append(slinner);
					let proc = attrs['proc'];
					let line = false;
					proc = proc ? btns[proc] : null;
					switch (attrs['ctrl']) {
					case 'editright':
						e2 = $('<input/>').attr({
							'field' : attrs['field'],
							'disable_on' : attrs['disable_on'],
							'type' : 'text',
						}).addClass('editright');
						line = true;
						break;
					case 'editleft':
						e2 = $('<input/>').attr({
							'field' : attrs['field'],
							'disable_on' : attrs['disable_on'],
							'type' : 'text',
						}).addClass('editleft');
						line = true;
						break;
					case 'textarea':
						e2 = $('<textarea/>').attr({
							'field' : attrs['field'],
							'disable_on' : attrs['disable_on'],
						}).addClass('editleft');
						line = true;
						break;
					case 'elm':
					case 'tag':
					case 'date':
					case 'radio':
					case 'select':
					case 'list':
					case 'verctrl':
						line = true;
					case 'button':
						attrs['formtype'] = undefined;
						e2 = $('<div/>').attr(attrs);
						break;
					}
					if (line) {
						slinner.addClass('slline');
					}
					if (e2!==null) {
						slinner.append($('<div/>').addClass('slinner2').append(e2));
					}
				}
				l = div.find('div[ctrl]');
				for (let i=0; i<l.length; i++) {
					const elm = l.eq(i);
					const attrs = makeAttrs(elm);
					let proc = attrs['proc'];
					proc = proc ? btns[proc] : null;
					try {
						switch (attrs['ctrl']) {
						case 'tag':
							Util.initTag(elm, mode, proc, attrs);
							break;
						case 'elm':
							Util.initElmList(elm, mode, proc, attrs);
							break;
						case 'list':
							Util.initList(elm, mode, proc, attrs);
							break;
						case 'date':
							Util.initDate(elm, mode, proc, attrs);
							break;
						case 'radio':
							Util.initRadio(elm, mode, proc, attrs);
							break;
						case 'select':
							Util.initSelect(elm, mode, proc, attrs);
							break;
						case 'verctrl':
							Util.initVerCtrl(elm, mode, proc, attrs);
							break;
						case 'button':
							for (let j=0; j<5; j++) {
								elm.append($('<button/>').addClass('btn btn-normal'));
							}
							Util.initButton(elm, proc, attrs);
							break;
						case 'button2':
							Util.initButton(elm, proc, attrs);
							break;
						}
					} catch (e) {}
				}
				l = div.find('select[proc]');
				for (let i=0; i<l.length; i++) {
					let elm = l.eq(i);
					const func = btns[elm.attr('proc')];
					if (func&&func.change) {
						elm.change(btns[elm.attr('proc')].change);
					}
				}
				div.find('*[disable_on]').prop('disabled', false);
				div.find("*[hide_on]").css('display', '');
				switch (mode) {
				case MODE.NEW:
					div.find(':not([type="radio"])[disable_on*=add]').prop('disabled', true);
					div.find("*[hide_on*=add]").css('display', 'none');
					div.find('[type="radio"][disable_on*=add]').parent().click(()=> { return false; });
					break;
				case MODE.EDIT:
					div.find(':not([type="radio"])[disable_on*=edit]').prop('disabled', true);
					div.find('*[hide_on*=edit]').css('display', 'none');
					div.find('[type="radio"][disable_on*=edit]').parent().click(()=> { return false; });
					break;
				case MODE.REF:
					div.find(':not([type="radio"])[disable_on*=ref]').prop('disabled', true);
					div.find('*[hide_on*=ref]').css('display', 'none');
					div.find('[type="radio"][disable_on*=ref]').parent().click(()=> { return false; });
					break;
				case MODE.REF2:
					div.find(':not([type="radio"])[disable_on*=rf2]').prop('disabled', true);
					div.find('*[hide_on*=rf2]').css('display', 'none');
					div.find('[type="radio"][disable_on*=rf2]').parent().click(()=> { return false; });
					break;
				}
				l = div.find('option[ltext],h2[ltext],span[ltext]');
				for (let i=0; i<l.length; i++) {
					let elm = l.eq(i);
					elm.text(_L(elm.attr('ltext')));
				}
				resolve();
			});
		});
	},
	initDate : function(elm, mode, arr, attrs) {
		const div = elm.get(0);
		div.obj = new DateCtrl(elm, attrs);
	},
	initButton : function(elm, arr, attrs) {
		const btns = elm.find('button');
		const len = btns.length;
		arr = arr ? arr : [];
		const start = len - arr.length;
		for ( let i=0; i<start; i++ ) {
			btns.eq(i).css('display', 'none');
		}
		for ( let i=0; i<arr.length; i++) {
			const btn = btns.eq(start + i).css('display', '');
			if (arr[i].text) {
				btn.text(_L(arr[i].text));
			}
			if (arr[i].click) {
				btn.click(arr[i].click);
			}
		}
		if (attrs) {
			elm.attr(attrs);
		}
	},
	initTag : function(tag, mode, proc, attrs) {
		let elm = tag.get(0);
		elm.obj = new Tag(tag.eq(0), mode, proc, attrs);
	},
	initElmList : function(list, mode, proc, attrs) {
		let elm = list.get(0);
		let limit = parseInt(list.eq(0).attr('limit'))||0;
		elm.obj = new ElmList(list.eq(0), mode, limit, proc, attrs);
	},
	initList : function(list, mode, proc, attrs) {
		const elm = list.get(0);
		let data = {};
		let cb = () => {};
		if (proc) {
			data = {
				div : list.eq(0),
				type : mode,
				col : proc.col,
				key : proc.key
			};
			cb = (code, d, list) => {
				switch (code) {
				case LIST_NOTIFY.DATA:
					if (proc.ondata) {
						return proc.ondata(d, list);
					}
					break;
				case LIST_NOTIFY.SELECT:
					if (proc.onselect) {
						return proc.onselect(d, list);
					}
					break;
				case LIST_NOTIFY.CREATE:
					if (proc.onadd) {
						return proc.onadd(d, list);
					}
					break;
				case LIST_NOTIFY.GETDATA:
					if (proc.ongetdata) {
						return proc.ongetdata(d, list);
					}
					break;
				case LIST_NOTIFY.BUTTON:
					if (proc.onbutton) {
						return proc.onbutton(d, list);
					}
					break;
				}
			};
		} else {
			data = {
				div : list.eq(0),
				type : mode,
			};
		}
		elm.obj = new List(data, cb, attrs);
	},
	initRadio : function(div, mode, proc, attrs) {
		const elm = div.get(0);
		elm.obj = new Radio(div, mode, proc, attrs);
	},
	initSelect : function(div, mode, proc, attrs) {
		const elm = div.get(0);
		elm.obj = new Select(div, mode, proc, attrs);
	},
	initVerCtrl : function(div, mode, proc, attrs) {
		const elm = div.get(0);
		elm.obj = new VerCtrl(div, mode, proc, attrs);
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
				case 'elm':
					elms.get(0).obj.set(dd);
					break;
				case 'list':
					elms.get(0).obj.set(dd);
					break;
				case 'date':
					elms.get(0).obj.setUTC(dd);
					break;
				case 'radio':
					elms.get(0).obj.set(dd);
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
				case 'elm':
					if (o) base[elm.attr('field')] = o.get();
					break;
				case 'list':
					if (o) base[elm.attr('field')] = o.onget();
					break;
				case 'date':
					if (o) base[elm.attr('field')] = o.getUTC();
					break;
				case 'radio':
					if (o) base[elm.attr('field')] = o.get();
					break;
				case 'select':
					base[elm.attr('field')] = elm.find('select').val();
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
	},
	isEosID : v => {
		try {
			const regex = /(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)/;
			return (v.match(regex)!==null)
		} catch (e) {
			return false;
		}
	},
	isNotEmpty : d => {
		return (d!==undefined)&&(d!=='');
	},
	isEmpty : d => {
		return (d===undefined)||(d==='');
	},
	isNumber : d => {
		return !isNaN(parseInt(d));
	}
};


function Tag(div, mode, proc, attrs) {
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
		div.addClass('elmallow');
	}
	for ( let i in attrs ) {
		div.attr(i, attrs[i]);
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
			if (v.keyCode===8) {
				if (inp.val().length===0) {
					this.data.pop();
					blur();
					this.set(this.data);
					this.click();
				}
			} else if (v.keyCode===9) {
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

function ElmList(div, mode, limit, proc, attrs) {
	this.div = div;
	this.mode = mode;
	this.limit = limit;
	this.proc = {
		click : (proc&&proc.click)||function(){},
		change : (proc&&proc.change)||function(){},
		name : (proc&&proc.name)||function(l){return l}
	};
	div.click(() => {
		if (this.mode!==MODE.REF) {
			this.click();
		}
	});
	this.allowedit(this.mode!==MODE.REF);
	this.list = $('<div/>').css('diplay','none').addClass('elmlistpd');
	this.back = $('<div/>').css('diplay','none').addClass('elmback').click(() => {
		this.cancelselect();
	});
	$('#main').append(this.list);
	$('#main').append(this.back);
	div.attr(attrs);
	
	this.list.hide();
	this.back.hide();
	this.data = [];
}

ElmList.prototype = {
	set : async function(data) {
		if (!(data instanceof Array)) {
			data = [data];
		}
		if (data&&data.length>0) {
			data = await this.proc.name(data);
		}
		await this.set2(data);
	},

	set2 : async function(data) {
		if (data instanceof Array) {
			let chk = {};
			this.data = [];
			data.forEach(v => {
				if (chk[v.key]!==undefined) return;
				chk[v.key] = true;
				this.data.push(v);
			});
		} else if ( typeof data === 'string' ) {
			this.data = [data];
		}
		this.div.empty();
		this.data.forEach(d => {
			const elm = $('<div>').addClass('userlist').text(d.name||d.key)
						.attr('key', d.key).click(() => {
							this.proc.click(d.key);
						});
			this.div.append(elm);
		});
	},
	get : function() {
		if (this.limit===1) {
			if (this.data.length===1) {
				return this.data[0].key;
			}
			return "";
		}
		let ret = [];
		this.data.forEach(v => {
			ret.push(v.key);
		});
		return ret;
	},
	click : function() {
		if (!this.allow) return;
		let inp = this.div.find('input');
		if (inp.length>0) {
			inp.remove();
			return;
		}
		let f = false;
		inp = $('<input type="text">').addClass('taginp').prop('size', 2)
			.keyup(() => {
				const len = inp.val().length;
				if (f&&(len>0)) this.proc.change({obj:this, input:inp});
				else if (len===0) {
					this.list.hide();
					this.back.hide();
				} else {
					return false;
				}
			});
		this.div.append(inp);
		inp.focus().keydown(async v=> {
			f = false;
			switch (v.keyCode) {
			case 38 : // up cursor
				this.changeselect(-1);
				return;
			case 40 : // down cursor
				this.changeselect(1);
				return;
			case 8: // back space
				if (inp.val().length===0) {
					this.data.pop();
					await this.set2(this.data);
					this.cancelselect();
					this.click();
					return;
				}
				break;
			case 9: // tab
			case 13: // enter
				await this.select();
				return;
			}
			if (this.limit>0 && this.data.length>=this.limit) {
				v.preventDefault();
				return;
			}
			f = true;
			let val = inp.val();
			inp.prop('size', val.bytes()+2);
		});
		this.inp = inp;
	},

	changeselect : function(add) {
		const sel = this.list.find('.sel');
		let idx = parseInt(sel.attr('idx')) || 0;
		idx += add;
		const next = this.list.find('li[idx="' + idx + '"]');
		if (next.length===0) return;
		sel.removeClass('sel').addClass('nosel');
		next.removeClass('nosel').addClass('sel');
	},
	select : async function(idx) {
		if (idx===undefined) {
			idx = this.list.find('.sel').attr('idx');
		}
		const elms = this.list.find('li[idx="' + idx + '"]');
		if (elms.length===0) {
			this.cancelselect();
		} else {
			this.data.push({
				key : elms.attr('key'),
				name : elms.attr('name')
			});
			this.list.hide();
			this.back.hide();
			this.inp.remove();
			await this.set2(this.data);
		}
		this.click();
	},
	pulldown : function(l) {
		const list = $('<ul/>');
		l.forEach((v, idx)=> {
			list.append(
				$('<li/>').attr({
					idx : idx,
					key : v.key,
					name : v.name
				}).text(v.name).addClass(idx===0 ? 'sel' : 'nosel')
			);
		});
		const self = this;
		list.find('li').click(function() {
			self.select($(this).attr('idx'));
		});
		const offset = this.inp.offset();
		//this.back.show();
		this.list.empty().css({
			'position' : 'absolute',
			'top' : offset.top + this.inp.height(),
			'left' : offset.left
		}).append(list).show();
	},
	cancelselect : function() {
		this.list.hide();
		this.back.hide();
		this.inp.remove();
	},

	disabled : async function(disable) {
		this.allowedit(!disable);
		if (disable) {
			this.div.addClass('elmdisabled');
		}
		await this.set2([]);
	},
	allowedit : function(allow) {
		this.allow = allow;
		if (allow) {
			this.div.addClass('elmallow').removeClass('elmdisallow elmdisabled');
		} else {
			this.div.addClass('elmdisallow').removeClass('elmallow elmdisabled');
		}
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

function DateCtrl(div, attrs) {
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
	for ( let i in attrs ) {
		div.attr(i, attrs[i]);
	}
	this.div = div;
}

DateCtrl.prototype = {
	getLocal : function() {
		try {
			if (this.val.toString()==='Invalid Date') {
				return '';
			}
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
			if (this.val.toString()==='Invalid Date') {
				return '';
			}
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
	},
	allowedit : function(allow) {
		const inp = this.div.children('input');
		inp.prop('disabled', !allow);
		if (!allow) {
			this.div.find('div>div').addClass('btn-disabled');
		} else {
			this.div.find('div>div').removeClass('btn-disabled');
		}
	}
};

function Select(div, mode, proc, attrs) {
	this.div = div;
	this.mode = mode;
	this.proc = {
		change : proc ? (proc.change||function(){}) : function(){}
	};
	const select = $('<select/>');
	div.append(select);
	const field = attrs['field'];
	let disable_on = attrs['disable_on']||'';
	disable_on = disable_on.split(',');
	let sel = attrs['sel'].split(',');
	sel.forEach(v => {
		v = v.split(':');
		const option = $('<option/>').attr({
					'value' : v[0],
					'ltext' : v[1],
				});
		select.append(option);
	});
	this.div.click(()=> {
		return this.canedit;
	});
	select.change(this.proc.change);
	const disable = disable_on.some(v => {
		if (v==='add' && mode===MODE.ADD) return true;
		if (v==='edit' && mode===MODE.EDIT) return true;
		if (v==='ref' && mode===MODE.REF) return true;
		if (v==='rf2' && mode===MODE.REF2) return true;
	});
	this.allowedit(!disable);
	for ( let i in attrs ) {
		div.attr(i, attrs[i]);
	}
}

Select.prototype = {
	allowedit : function(v) {
		this.canedit = v;
	}
}

class VerCtrl {
	constructor(div, mode, proc, attrs) {
		this.div = div;
		this,mode = mode;
		this.proc = proc;
		this.attrs = attrs;
		this.draw();
	}

	async draw() {
		const elm = $('<div/>').addClass('verctrl');
		this.div.append(elm);
		elm.click(()=> {
			this.proc&&this.proc['onclick']&&this.proc['onclick'](this);
		});
		await this.proc&&this.proc['oninit']&&this.proc['oninit'](this);
	}

	val(v) {
		if (v.length!==4) return;
		const out = [];
		const elm = this.div.find('.verctrl');
		const code = {
			true : '<span>&#9733;</span>',
			false : '<span>&#9734;</span>'
		}
		out.push(code[v[1]]);
		out.push(v[0]);
		out.push('&nbsp;&nbsp;&nbsp;&nbsp;');
		out.push(code[v[3]]);
		out.push(v[2]);
		elm.html(out.join(''));
	}
};


function Radio(div, mode, proc, attrs) {
	this.div = div;
	this.mode = mode;
	this.proc = {
		change : proc ? (proc.change||function(){}) : function(){}
	};
	div.addClass('btn-group btn-group-toggle')/*.attr('data-toggle','buttons')*/;
	const field = attrs['field'];
	let disable_on = attrs['disable_on']||'';
	disable_on = disable_on.split(',');
	let sel = attrs['sel'].split(',');
	sel.forEach(v => {
		v = v.split(':');
		const label = $('<label class="btn btn-normal"/>')
				.append($('<input/>').attr({
					'type' : 'radio',
					'autocomplete' : 'off',
					'value' : v[0],
					'field' : field,
				})).append($('<span/>').attr('ltext',v[1]));
		div.append(label);
	});
	this.div.click(()=> {
		return this.canedit;
	});
	const disable = disable_on.some(v => {
		if (v==='add' && mode===MODE.ADD) return true;
		if (v==='edit' && mode===MODE.EDIT) return true;
		if (v==='ref' && mode===MODE.REF) return true;
		if (v==='rf2' && mode===MODE.REF2) return true;
	});
	this.allowedit(!disable);
	const self = this;
	this.div.find('[type="radio"]').change(function() {
		self.proc.change(this.value);
		self.set(this.value);
	});
	this.value = null;
	for ( let i in attrs ) {
		div.attr(i, attrs[i]);
	}
}


Radio.prototype = {
	set : function(v) {
		this.value = v;
		let radio = this.div.find('[type="radio"]').parent().removeClass('active');
		this.div.find(':not([value="' + v + '"])').prop('checked', false);
		this.div.find('[value="' + v + '"]').parent().addClass('active');
	},
	get : function(v) {
		return this.value;
	},
	enable : function(v) {
		const radio = this.div.find('[type="radio"]');
		if (v) {
			radio.parent().removeClass('btn-disabled');
			this.canedit = true;
		} else {
			radio.parent().addClass('btn-disabled').removeClass('active');
			this.canedit = false;
			this.value = null;
		}
		radio.prop('disabled', v ? false : true);
	},
	allowedit : function(v) {
		this.canedit = v;
	}
};

class View {
	constructor() {
		this.Validator.parent = this;
	}
}
