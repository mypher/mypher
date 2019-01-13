// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const childProcess = require('child_process');
const eos = require('../db/eos');

let an = /^[abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ_]*$/;
module.exports = {
	chkParams : (prm, req) => {
		for (let i in req) {
			if (req[i]===true&&prm[i]===undefined) return i;
		}
		return null;
	},

	fillParams : (prm, req) => {
		for (let i in req) {
			if (req[i]===false&&prm[i]===undefined) {
				prm[i] = '';
			}
		}
		return prm;
	},
	null2Empty : prm => {
		for (let i in prm) {
			if (prm[i]===null) {
				prm[i] = '';
			}
		}
		return prm;
	},

	chkEither : (prm, req) => {
		for (let i in req) {
			if (req[i]===false&&prm[i]!==undefined) {
				return true;
			}
		}
		return false;
	},

	buildUpdate : (tb, prm, flds) => {
		let ix = 1;
		let nms = [], ret = [], keys = [];
		for (let i in prm) {
			if (flds[i]===false) {
				nms.push(i + '=$' + (ix++));
				ret.push(prm[i]);
			} else if (flds[i]===true) {
				keys.push(i + '=$' + (ix++));
				ret.push(prm[i]);
			}
		}
		return {
			sql : 'update ' + tb + ' set ' + nms.join(', ') + ' where ' + keys.join(' and '),
			prm : ret
		};
	},

	stdtm : () => {
		let now = new Date();
		return new Date(now.getTime() + now.getTimezoneOffset()*60*1000);
	},

	d2st : (d) => {
		let sup = (n, l) => {
			return (n>9) ? n : ('0' + n);
		}
		try {
			return [
				sup(d.getFullYear()),
				sup(d.getMonth()+1),
				sup(d.getDate()),
				sup(d.getHours()),
				sup(d.getMinutes()),
				sup(d.getSeconds())
			].join('');
		} catch (e) {
			return '';
		}
	},

	isKey : d => {
		return (typeof(d)==='string') && (d.length===64);
	},

	isKeyOrEmpty : d => {
		return ((typeof(d)==='string') && (d.length===64)) || d==='';
	},

	isUint16 : d => {
		try {
			var d = parseInt(d);
			return (0<=d)&&(d<=65535);
		} catch (e) {
			return false;
		}
	},

	isSmallInt : d => {
		try {
			var d = parseInt(d);
			return (-32768<=d)&&(d<=32767);
		} catch (e) {
			return false;
		}
	},

	isNumber : d => {
		try {
			return (parseInt(d)!=NaN);
		} catch (e) {
			return false;
		}
	},

	isEmpty : d => {
		return (typeof(d)!=='string') || (d.length===0);
	},

	isString : d => {
		return (typeof(d)==='string');
	},

	chkTypes : p => {
		let ret = false;
		p.some(v=> {
			let f = v.r?v.r:false;
			ret = f ? v.f(v.p, v.v) : !v.f(v.p, v.v);
			return ret;  
		});
		return !ret;
	},

	toInt : (p, ar) => {
		ar.forEach(v => {
			p[v] = parseInt(p[v]);
			if (isNaN(p[v])) p[v] = null;
		});
		return p;
	},

	isArray : d => {
		return d instanceof Array;
	},

	isDateTime : d => {
		try {
			new Date(
				parseInt(d.substr(0,4)),
				parseInt(d.substr(4,2))-1,
				parseInt(d.substr(6,2)),
				parseInt(d.substr(8,2)),
				parseInt(d.substr(10,2)),
				parseInt(d.substr(12,2)),
				parseInt(d.substr(14,2)),
			);
			return true;
		} catch (e) {
			return false;
		}
	},

	isStrLen : (v, l) => {
		try {
			return v.length===l;
		} catch (e) {
			return false;
		}
	},

	isStrNumber : v => {
		try {
			// allow null
			return /^[0-9]*$/.exec(v)!==null;
		} catch (e) {
			return false;
		}
	},

	isStrHex : v => {
		try {
			return /^[0-9a-fA-F]*$/.exec(v)!==null;
		} catch (e) {
			return false;
		}
	},


	isDate : d => {
		try {
			new Date(
				parseInt(d.substr(0,4)),
				parseInt(d.substr(4,2))-1,
				parseInt(d.substr(6,2)),
			);
			return true;
		} catch (e) {
			return false;
		}
	},

	sleep : async t => {
		return new Promise(resolve => {
			setTimeout(()=> {
				resolve();
			}, t);
		});
	},

/*	chkRule : async (req, auth) => {
		try {
			auth = auth.split(',');
			let cnt = await db.one(
				'select count(id) from person where id in ($1:csv)', [auth]
			);
			let dbcnt = parseInt(cnt.count);
			return (req<=dbcnt)&&(auth.length===dbcnt);
		} catch (e) {
			return false;
		}
	},*/
	chkMember : async (list, tx) => {
		try {
			tx = tx ? tx : db;
			list = (apicmn.isEmpty(list)) ? [] : list.split(',');
			let cnt = await tx.one(
				'select count(id) from person where id in ($1:csv)', [list]
			);
			let dbcnt = parseInt(cnt.count);
			return (list.length===dbcnt);
		} catch (e) {
			return false;
		}
	},

	isMember : (person, list) => {
		let ret = false;
		list.split(',').some(v=> {
			if (person===v) {
				ret = true;
				return true;
			}
		})
		return ret;
	},

	addMember : (person, list) => {
		if (list==='') return person;
		let found = false;
		list.split(',').some(v=> {
			if (v===person) {
				found = true;
				return true;
			}
		});
		return list + (found ? '' : (',' + person));
	},

	removeMember : (person, list) => {
		let ret = [];
		list.split(',').forEach(v=> {
			if (v!==person) {
				ret.push(v);
			}
		});
		return ret.join(',');
	},

	nofMember : list => {
		return (list==='') ? 0 : list.split(',').length;	
	},

	getReq : (base, list) => {
		return (base===0) ? list.split(',').length : base;
	},

	validate : (o1, o2) => {
		for (let i in o1) {
			if (o1[i]!=o2[i]) return false;
		}
		return true;
	},
	
	isAlphaNumeric : v => {
		return (v.match&&v.match(an));
	},

	chkStrLen : (v,min, max) => {
		return (typeof(v)==='string'&&v.length<=max&&v.length>=min);
	},

/*	isCipherEditable : async (sender, key) => {
		let response = {};
		try {
			await db.tx(async t=>{
				// load cipher to which task belongs
				let cdata = await dcipher.load({
					id : key.id,
					ver : key.ver,
					draftno : key.draftno
				});
				// check if cipher can be edited
				response = vcipher.isEditableVer(cdata);
					if (response.code) {
					return;
				}
				// if sender is not editor, task can't be updated
				response = vcipher.isEditor(sender, cdata);
				if (response.code) {
					return;
				}
			});
			return response;
		} catch (e) {
			log.error('errored in _add : ' + e);
			throw 'system error';		
		}	
	},*/
	compare : (p1, p2, names) => {
		for (var i in names) {
			if (p1[i]!==p2[i]) return false;
		}
		return true;
	},

	cmd : async c => {
		return new Promise(function(resolve, reject) {
			childProcess.exec(c, (error, stdout, stderr) => {
				if(error) {
					log.error(stderr);
					reject(stderr);
				}
				resolve(stdout);
			});
		})
	},

	isEosID : id => {
		return typeof(id)==='string' && (/^[1-5a-z]{1,12}$/.exec(id)!==null);
	},

	isIpfsKey : key => {
		return (/^Qm[0-9a-zA-Z]{44}$/.exec(key)!==null);
	},

	NUMBER_NULL : 0xffffffff, // TODO:javascript can't deal with 64bit number

	num2st : v => {
		if (v===apicmn.NUMBER_NULL) {
			return '';
		}
		return String(v);
	},

	st2num : v => {
		const id = parseInt(v);
		return isNaN(id) ? apicmn.NUMBER_NULL : id;
	},

	ui82st : v => {
		if (v===255) {
			return '';
		}
		return String(v);
	},

	st2ui8 : v => {
		const id = parseInt(v);
		return isNaN(id) ? 255 : id;
	},

	parseEosError : e => {
		const err = /^assertion failure with error code: ([0-9]+)$/.exec(e.message);
		const err2 = /^account lamb has insufficient ram; needs ([0-9]+) bytes has ([0-9]+) bytes/.exec(e.message);
		if (err===null||err.length===1) {
			if (err2!==null&&err2.length===3) {
				return {code:'E9998', data:[err2[1], err2[2]]};
			} else if (e.json.code!==undefined) {
				return {code:'EI' + e.json.code};
			} else {	
				return {code:'E9999'};
			}
		}
		return {code:'E' + err[1]};
	},

	waitcommit : async info => {
		await apicmn.sleep(500);
		for ( let i=0; i<5; i++) {
			try {
				await apicmn.sleep(300);
				const result = await eos.getTransaction(info.transaction_id, info.processed.block_num);
				break;
			} catch (e) {
				// not sent yet
			}
		}
	}
};

const apicmn = module.exports;
