// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//
class Cipher {
	// if show the formal version, 
	// it is not needed to specify "cdraftid"
	constructor(d) {
		this.mode = d.mode ? d.mode : MODE.REF;
		this.data = {
			cipherid : d.cipherid,
			cdraftid : d.cdraftid,
			tokenlist : [],
			tasklist : []
		};
		this.div = d.div;
	}

	save() {
	}
	
	async current() {
		try {
			this.data = await Rpc.call(
				'cipher.get',
				[{
					cipherid : this.data.cipherid,
					cdraftid : this.data.cdraftid
				}]
			);
		} catch (e) {
			UI.alert(e);
		}
	}

	get() {
		return Util.getData(this.div, {
			cipherid : this.data.cipherid,
			cdraftid : this.data.cdraftid,
			tasklist : this.data.tasklist,
			tokenlist : this.data.tokenlist
		});
	}

	async set(data) {
		data.purpose = _L('LOADING');
		this.data = data;
		try {
			if (data.multisig) {
				const d = await Rpc.call('multisig.search', [{id:data.multisig}]);
				if (d) {
					this.data.coowner = d.coowner;
					this.data.threshold = d.threshold;
				}
			}
		} catch (e) {}
		Util.setData(this.div, this.data);
		this.mkBtn2();
		const drawDesc = o => {
			const v = {
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
			UI.alert(e);
			drawDesc({});
		});
	}

	async newDraft() {
		try {
			const newid = await Rpc.call(
				'cipher.copy',
				[{
					user : Account.loginUser(),
					cdraftid : this.data.cdraftid,
					cipherid : this.data.cipherid
				}]
			);
			if (newid===-1) {
				UI.alert(_L('FAILED_TO_GET_DATA'));
				return;
			}
			this.data.cdraftid = newid;
			this.mode = MODE.REF;
			await this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	async approve(f) {
		try {
			await Rpc.call(
				'cipher.approve',
				[{
					user : Account.loginUser(),
					cipherid : this.data.cipherid,
					cdraftid : this.data.cdraftid,
					approve : f
				}]
			);
			await this.draw();
		} catch (e) {
			UI.alert(e);
		}
	}

	mkBtn1() {
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
	}

	mkBtn2() {
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
		Util.initButton(this.div.find('div[name="button2"]').eq(0), btns);
	}

	async refresh() {
		const btn1 = this.mkBtn1();
		const person =  {
			click : key => {
				const user = new User({
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
							key : v.personid,
							name : v.pname + '（' + v.personid + '）'
						});
					});
					elm.obj.pulldown(l);
				}).catch(e => {
					UI.alert(e);
				});;
			},
			name : async l => {
				try {
					l = await Rpc.call('person.name', [l]);
					let ret = [];
					l.forEach(v => {
						ret.push({
							key : v.personid,
							name : v.pname + '（' + v.personid + '）'
						});
					});
					return ret;
				} catch (e) {
					UI.alert(e);
					return [];
				}
			}
		};
		await Util.load(this.div, 'parts/cipher.html', this.mode, {
			tags : {
				click : () => {
					return true;
				}
			},
			button1 : btn1,
			button2 : [],
			coowner : person,
			editors : person,
			authors : person,
			approved : person,
			verdraft : {
				oninit : async d => {
					const v = await this.getVerDraftVal();
					d.val(v);
				},
				onclick : async d => {
					if (this.mode !== MODE.REF) return;
					const ch = new CipherHist({
						cipherid : this.data.cipherid,
						div : UI.popup(700,500),
						cb : d => {
							this.data = {
								cipherid : this.data.cipherid,
								cdraftid : d.cdraftid,
							};
							UI.closePopup();
							this.draw();
						}
					});
					ch.draw();
				}
			},
			tokenlist : {
				col : [
					{ width : 6, label : _L('ID'), name : 'tokenid' },
					{ width : 6, label : _L('NAME2'), name : 'tkname' }
				],
				key : [],
				ondata : (d, list) => {
					if (this.data.tokenlist.length===0) {
						list.show([]);
						return;
					}
					Rpc.call('token.list_for_cipher', [{
						cipherid: this.data.cipherid,
						list : this.data.tokenlist,
					}]).then(ret => {
						list.show(ret);
					}).catch( e => {
						UI.alert(e);
					});
				},
				onselect : (d, list) => {
					const token = new Token({
						div : $('#main'),
						cipherid : this.data.cipherid,
						cdraftid : this.data.cdraftid,
						editors : this.data.formal ? [] : this.data.editors,
						tokenid : d.tokenid,
						mode : MODE.REF
					});
					History.run(_L('TOKEN'), token);
				},
				onadd : (d, list) => {
					const token = new Token({
						div : $('#main'),
						cipherid : this.data.cipherid,
						cdraftid : this.data.cdraftid,
						editors : this.data.formal ? [] : this.data.editors,
						mode : MODE.NEW
					});
					History.run(_L('TOKEN'), token);
				}	
			},
			tasklist : {
				col : [
					{ width : 6, label : _L('ID'), name : 'tdraftid' },
					{ width : 6, label : _L('NAME2'), name : 'taname' }
				],
				key : [],
				ondata : (d, list) => {
					if (this.data.tasklist.length===0) {
						list.show([]);
						return;
					}
					Rpc.call('task.list_for_cipher', [{
						cipherid : this.data.cipherid,
						list : this.data.tasklist,
					}]).then(ret => {
						list.show(ret);
					}).catch( e => {
						UI.alert(e);
					});
				},
				onselect : (d, list) => {
					const task = new Task({
						div : $('#main'),
						cipherid : this.data.cipherid,
						cdraftid : this.data.cdraftid,
						tdraftid : d.tdraftid,
						editors : this.data.formal ? [] : this.data.editors,
						mode : MODE.REF
					});
					History.run(_L('TASK'), task);
				},
				onadd : (d, list) => {
					const task = new Task({
						div : $('#main'),
						cipherid : this.data.cipherid,
						cdraftid : this.data.cdraftid,
						editors : this.data.formal ? [] : this.data.editors,
						mode : MODE.NEW
					});
					History.run(_L('TASK'), task);
				}
			},
		});
		this.set(this.data);
		const inp_multisig = $('input[field="multisig"]:eq(0)');
		inp_multisig.blur(async () => {
			try {
				const val = inp_multisig.val();
				if (val==='') {
					if (this.data.multisig!=='') {
						this.data = this.get();
						this.data.threshold='';
						this.data.coowner = [];
						this.data.multisig = '';
						this.set(this.data);
						return;
					}
				}
				if (val===this.data.multisig) return;
				const d = await Rpc.call('multisig.search', [{id:val}]);
				this.data = this.get();
				this.data.threshold = d.threshold;
				this.data.coowner = d.coowner;
				this.set(this.data);
			} catch (e) {
				UI.alert(_L('NOT_FOUND'));
				inp_multisig.val(this.data.multisig);
			}
		});
		this.div.find('button[name="hist"]').click(() => {
			this.hist();
		});
	}

	async getVerDraftVal() {
		
		if (Util.isNumber(this.data.version) && Util.isNumber(this.data.no)) {
			const fml = (parseInt(this.data.version)==parseInt(this.data.formalver)) 
					&& (parseInt(this.data.no)==parseInt(this.data.formaldraft));
			return [_L('FMT_VER', this.data.version), fml, _L('FMT_DRAFT', this.data.no), fml];
		}
		return [_L('FMT_VER_UNKNOWN'), false, _L('FMT_DRAFT_UNKNOWN'), false];
	}

	async hist() {
		const ver = new CipherHist({
			cipherid : this.data.cipherid,
			div : $('#main')
		});
		History.run(_L('HISTORY1'), ver);
	}

	async draw() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		}
		await this.refresh();
	}

	async add() {
		let data = this.get();
		data.user = Account.user;
		try {
			await Rpc.call('cipher.add', [data]);
			History.back();
		} catch (e) {
			UI.alert(e);
		}
	}

	async commit() {
		let data = this.get();
		data.user = Account.user;
		try {
			await Rpc.call(
				'cipher.edit',
				[data]
			);
			this.mode = MODE.REF;
			await this.refresh();
		} catch (e) {
			UI.alert(e);
		}
	}

	async startedit() {
		this.mode = MODE.EDIT;
		await this.refresh();
	}
};

Cipher.prototype.Validator = {
	isEditableVer : function(data) {
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
		if (parseInt(data.version)>parseInt(data.formalver)) {
			return true;
		}
		// latest formal version can be used for source.
		if (parseInt(data.version)===parseInt(data.formalver) && 
			parseInt(data.no)===parseInt(data.formaldraft)) {
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
			if (!data.approvers.includes(user)) {
				return false;
			}
		} catch (e) {
			return false;
		}

		try {
			// check if person already approved
			if (data.approved.includes(user)) {
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
			if (!data.approvers.includes(user)) {
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
