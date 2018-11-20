// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

function Cipher(d) {
	this.mode = d.mode ? d.mode : MODE.REF;
	this.data = {
		id : d.id
	};
	this.div = d.div;
}

Cipher.prototype = {
	save : function() {
	},
	
	current : async function() {
		let info = await Rpc.call(
			'cipher.get',
			[{id:this.data.id}]
		);
		if (info.code!==undefined) {
			UI.alert(info.code);
			return;
		}
		this.data = info.data;
	},

	get : function() {
		return Util.getData(this.div, {});
	},

	set : async function(data) {
		data.purpose = _L('LOADING');
		this.data = data;
		Util.setData(this.div, this.data);
		this.mkBtn2();
		const drawDesc = o => {
			v = {
				purpose : o.purpose
			};
			Object.assign(this.data, v);
			Util.setData(this.div, v);
		};
		Rpc.call(
			'cipher.get_desc',
			[{hash:this.data.hash}]
		).then(info => {
			drawDesc(info);
		}).catch(e => {
			drawDesc({});
		});
	},

	newDraft : async function() {
		const newid = await Rpc.call(
			'cipher.copy',
			[{
				user : Account.loginUser(),
				id : this.data.id,
				cipherid : this.data.cipherid
			}]
		);
		if (newid===-1) {
			UI.alert(_L('FAILED_TO_GET_DATA'));
			return;
		}
		this.data.id = newid;
		this.mode = MODE.REF;
		await this.draw();
	},

	mkBtn1 : function() {
		switch (this.mode) {
		case MODE.EDIT:
			return [{
				text : 'COMMIT',
				click : () => { this.commit(); }
			},{
				text : 'RELOAD',
				click : () => { this.refresh(); }
			}];
		case MODE.NEW:
			return [{
				text : 'CREATE',
				click : () => { this.add(); }
			},{
				text : 'CANCEL',
				click : () => { History.back(); }
			}];
		}
		return [];
	},

	mkBtn2 : function() {
		let btns = [];
		if (this.mode===MODE.REF) {
			let user = Account.loginUser();
			let vali = this.Validator;
			if (vali.isEditable(this.data, user)) {
				btns.push({
					text : 'EDIT',
					click : () => { this.startedit(); }
				});
			}
			if (vali.canUseForSource(this.data) && user != null) {
				btns.push({
					text : 'NEW_DRAFT',
					click : () => { this.newDraft(); }
				});
			}
			if (vali.canApprove(this.data, user)) {
				btns.push({
					text : 'APPROVE',
					click : () => { this.approve(true); }
				});
			} else if (vali.canCancelApprovement(this.data, user)) {
				btns.push({
					text : 'REVERT_APPROVE',
					click : () => { this.approve(false); }
				});
			}
		} else if (this.mode===MODE.EDIT) {
			btns.push({
				text : 'BACK',
				click : () => { 
					this.mode = MODE.REF;
					this.refresh();
				}
			});
		}
		Util.initButton(this.div.find('div[name="cp_button2"] button'), btns);
	},

	refresh : async function() {
		const btn1 = this.mkBtn1();
		const person =  {
			click : key => {
				let user = new User({
					div : $('#main'),
					name : key 
				});
				History.run(_L('USER'), user);
			},
			change : elm => {
				Rpc.call('person.list_byname', [elm.input.val()])
				.then(ret => {
					let l = [];
					ret.forEach(v => {
						l.push({
							key : v.id,
							name : v.name + '（' + v.id + '）'
						});
					});
					elm.obj.pulldown(l);
				});
			},
			name : async l => {
				l = await Rpc.call('person.name', [l]);
				let ret = [];
				l.forEach(v => {
					ret.push({
						key : v.id,
						name : v.name + '（' + v.id + '）'
					});
				});
				return ret;
			}
		};
		await Util.load(this.div, 'parts/cipher.html', this.mode, {
			draft : [{
				click : () => {
					this.hist();
				}
			}],
			tags : {
				click : () => {
					return true;
				}
			},
			button1 : btn1,
			button2 : [],
			editors : person,
			authors : person,
			approved : person,
			token : {
				col : [
					{ width : 6, label : _L('ID'), name : 'id' },
					{ width : 6, label : _L('NAME2'), name : 'name' }
				],
				key : [],
				ondata : (d, list) => {
					Rpc.call('token.list_bycipherid', [d])
					.then(ret => {
						list.show(ret);
					}).catch( e=> {
					});
				},
				onselect : (d, list) => {
					const token = new Token({
						div : $('#main'),
						id : d.id,
						mode : MODE.REF
					});
					History.run(_L('TOKEN'), token);
				},
				onadd : (d, list) => {
					const token = new Token({
						div : $('#main'),
						cipherid : this.data.id,
						mode : MODE.ADD
					});
					History.run(_L('TOKEN'), token);
				}	
			},
			task : {
				col : [
					{ width : 6, label : _L('ID'), name : 'id' },
					{ width : 6, label : _L('NAME2'), name : 'name' }
				],
				key : [],
				ondata : (d, list) => {
					Rpc.call('task.list_bycipherid', [d])
					.then(ret => {
						list.show(ret);
					}).catch( e=> {
					});
				},
				onselect : (d, list) => {
					const task = new Task({
						div : $('#main'),
						id : d.id,
						mode : MODE.REF
					});
					History.run(_L('TOKEN'), task);
				},
				onadd : (d, list) => {
					const task = new Task({
						div : $('#main'),
						cipherid : this.data.id,
						mode : MODE.ADD
					});
					History.run(_L('TOKEN'), task);
				}	
			},
			rule : {
				col : [
					{ width : 6, label : _L('ID'), name : 'id' },
					{ width : 6, label : _L('NAME2'), name : 'name' }
				],
				key : [],
				ondata : (d, list) => {
					list.show([
					]);
				},
				onselect : (d, list) => {
					// d.id
				},
				onadd : (d, list) => {
				}	
			}
		});
		this.set(this.data);
	},

	hist : async function() {
		const ver = new CipherHist({
			cipherid : this.data.cipherid,
			div : $('#main')
		});
		History.run(_L('HISTORY1'), ver);
	},

	draw : async function() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		}
		await this.refresh();
	},

	add : async function() {
		let data = this.get();
		data.user = Account.user;
		try {
			let ret = await Rpc.call(
				'cipher.add',
				[data]
			);
			if (ret.code!==undefined) {
				UI.alert(ret.code);
				return;
			}
			History.back();
		} catch (e) {
			UI.alert(e.message);
		}
	},

	commit : async function() {
		let data = this.get();
		data.user = Account.user;
		try {
			let ret = await Rpc.call(
				'cipher.edit',
				[data]
			);
			if (ret.code!==undefined) {
				UI.alert(ret.code);
				return;
			}
			this.mode = MODE.REF;
			await this.refresh();
		} catch (e) {
			UI.alert(e.message);
		}
	
	},

	startedit : async function() {
		this.mode = MODE.EDIT;
		await this.refresh();
	}
};

Cipher.prototype.Validator = {
	isEditableVer : function(data) {
		// if a draft is formalized yet, it is editable
		if (!data.formalver) {
			return true;
		}
		// only the case which version is bigger than latest formal version, a draft is editable
		if (data.formalver >= data.version) {
			return false;
		}
		return true;
	},

	isEditor : function(data, user) {
		try {
			return data.editors.includes(user);
		} catch (e) {
			return false;
		}
	},

	isEditable : function(data, user) {
		return (this.isEditableVer(data)&&this.isEditor(data, user));
	},

	canUseForSource : function(data) {
		// a draft whose version is bigger than latest formal version can be used for source.
		if (data.version>data.formalver) {
			return true;
		}
		// latest formal version can be used for source.
		if (data.version===data.formalver && data.draftno===data.formaldraft) {
			return true;
		}
		return false;
	},

	canApprove : function(data, user) {
		// only editable draft can be approved
		if (!this.isEditableVer(data)) {
			return false;
		}
		try {
			// check if person is approver
			if (!data.drule_auth.includes(user)) {
				return false;
			}
		} catch (e) {
			return false;
		}

		try {
			// check if person already approved
			if (data.approved.include(user)) {
				return false;
			}
		} catch (e) {
			// not approved yet
		}
		return true;
	},

	canCancelApprovement : function(data, user) {
		// only editable draft can be canceled
		if (!this.isEditableVer(data)) {
			return false;
		}
		try {
			// check if person is approver
			if (!data.drule_auth.includes(user)) {
				return false;
			}
			// check if person approved
			if (!data.approved.includes(user)) {
				return false;
			}
		} catch (e) {
			return false;
		}
		return true;
	}
};


//# sourceURL=cipher.js
