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
		this.data = info.data;
	},

	set : async function(data) {
		this.data = data;
		Util.setData(this.div, this.data);
		this.mkBtn2();
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
					click : () => { this.edit(); }
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
				click : function() { this.cancel(); }
			});
		}
		Util.initButton(this.div.find('div[name="cp_button2"] button'), btns);
	},

	refresh : async function() {
		let btn1 = this.mkBtn1();
		await Util.load(this.div, 'parts/cipher.html', this.mode, {
			draft : [],
			tags : {
				click : () => {
					return true;
				}
			},
			button1 : btn1,
			button2 : [],
			editors : {
				click : () => {
					return true;
				}
			},
			authrors : {
				click : () => {
					return true;
				}
			},
			approved : {
				click : () => {
					return true;
				}
			}
		});
		this.set(this.data);
	},

	draw : async function() {
		if (this.mode!==MODE.NEW) {
			await this.current();
		}
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
