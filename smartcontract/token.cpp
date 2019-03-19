// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>
#include "common/validator.hpp"
#include "common/prim.hpp"
#include <stdio.h>
#include <eosiolib/transaction.hpp>

void Mypher::tknew(const eosio::name sender, const uint64_t cdraftid,
			   const string& tkname, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken, 
			   const uint8_t rcalctype, const uint64_t nofdesttoken, const uint64_t nofdesteos) {

	check_data4token(sender, tkname, issuer, limit, when, disposal, type, 
			taskid, extokenid, reftoken, rcalctype, nofdesttoken, nofdesteos);
	
	uint64_t id = token_data.available_primary_key();
	// create new token
	token_data.emplace(sender, [&](auto& dd) {
		dd.tokenid = id;
		dd.tkname = tkname;
		dd.issuer = issuer;
		dd.limit = limit;
		dd.when = when;
		dd.disposal = disposal;
		dd.type = type;
		dd.taskid = taskid;
		dd.extokenid = extokenid;
		dd.reftoken = reftoken;
		dd.rcalctype = rcalctype;
		dd.nofdesttoken = nofdesttoken;
		dd.nofdesteos = nofdesteos;
	});
	// update cipher information
	cdraft_def d2(_self, issuer);
	auto rec = d2.find(cdraftid);
	eosio_assert_code(rec!=d2.end(), NOT_FOUND);
	eosio_assert_code(is_draft_version(issuer, rec->version), ALREADY_FORMAL);
	// append token to cipher
	d2.modify(rec, sender, [&](auto& dd){
		dd.tokenlist.push_back(id);	
	});
}

void Mypher::tkupdate(const eosio::name sender, const uint64_t cdraftid,
			   const uint64_t tokenid,
			   const string& tkname, const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint32_t reftoken,  
			   const uint8_t rcalctype, const uint32_t nofdesttoken, uint64_t nofdesteos ) {

	auto rec = token_data.find(tokenid);
	// check if data exists
	eosio_assert_code(rec!=token_data.end(), NOT_FOUND);

	// check if token already issued
	eosio_assert_code(!is_issued(tokenid), TOKEN_ALREADY_ISSUED);

	// check if specified cid is valid	
	check_data4token(sender, tkname, rec->issuer, limit, when, disposal, type, 
			taskid, extokenid, reftoken, rcalctype, nofdesttoken, nofdesteos);

	// if specified token is shared between some drafts, generates copy of the draft
	if (is_token_shared(tokenid, rec->issuer, cdraftid)) {
		uint64_t id = token_data.available_primary_key();
		token_data.emplace(sender, [&](auto& dd) {
			dd.tokenid = id;
			dd.tkname = tkname;
			dd.issuer = rec->issuer;
			dd.limit = limit;
			dd.when = when;
			dd.disposal = disposal;
			dd.type = type;
			dd.taskid = taskid;
			dd.extokenid = extokenid;
			dd.reftoken = reftoken;
			dd.rcalctype = rcalctype;
			dd.nofdesttoken = nofdesttoken;
			dd.nofdesteos = nofdesteos;
		});
		// update the id registered in cipher to new one
		cdraft_def cd(_self, rec->issuer);
		auto crec = cd.find(cdraftid);
		eosio_assert_code(is_draft_version(rec->issuer, crec->version), ALREADY_FORMAL);
		eosio_assert_code(crec!=cd.end(), INVALID_PARAM); 
		cd.modify(crec, sender, [&](auto& dd){
			std::replace(dd.tokenlist.begin(), dd.tokenlist.end(), rec->tokenid, id);
		});
	} else {
		token_data.modify(rec, sender, [&](auto& dd){
			dd.tkname = tkname;
			dd.limit = limit;
			dd.when = when;
			dd.disposal = disposal;
			dd.type = type;
			dd.taskid = taskid;
			dd.extokenid = extokenid;
			dd.reftoken = reftoken;
			dd.rcalctype = rcalctype;
			dd.nofdesttoken = nofdesttoken;
			dd.nofdesteos = nofdesteos;
		});
	}
}

void Mypher::check_data4token( const eosio::name sender, 
			   const string& tkname, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken,
			   const uint8_t rcalctype, const uint64_t nofdesttoken,
			   const uint64_t nofdesteos ) {

	// check if sender is login user
	require_auth(sender);
	// check if "type" is valid
	eosio_assert_code(type<TYPE_MAX, INVALID_PARAM);
	// check if "when" is valid
	eosio_assert_code(when<WHEN_MAX, INVALID_PARAM);
	// check if "disposal" is valid
	eosio_assert_code(disposal<DISPOSAL_MAX, INVALID_PARAM);
	// check is task is exists
	if (taskid!=NUMBER_NULL) {
		eosio_assert_code(is_tdraft_exists(issuer, taskid), INVALID_PARAM);
	}
	// check if token is exists
	if (extokenid!=NUMBER_NULL) {
		eosio_assert_code(is_token_exists(extokenid), INVALID_PARAM);
	}
	// check condition for each "type"
	switch (type) {
	case DISTRIBUTE_TOKEN: 
		eosio_assert_code(extokenid!=NUMBER_NULL, INVALID_PARAM);
		eosio_assert_code(nofdesttoken!=NUMBER_NULL && nofdesttoken>0, INVALID_PARAM);
		break;
	case DISTRIBUTE_CRYPTOCURRENCY:
		eosio_assert_code(nofdesteos>0, INVALID_PARAM);
		break;
	}
	// check condition for each "when"
	switch (when) {
	case COMPLETE_TASK:
		eosio_assert_code(taskid!=NUMBER_NULL, INVALID_PARAM);
		break;
	case OVER_ISSUER_OWNED_TOKEN:
		eosio_assert_code(extokenid!=NUMBER_NULL, INVALID_PARAM);
		eosio_assert_code(reftoken!=NUMBER_NULL && reftoken>0, INVALID_PARAM);
		break;
	}
}

bool Mypher::is_token_shared(const uint64_t tokenid, const uint64_t cipherid, const uint64_t cdraftid) {
	cdraft_def d(_self, cipherid);
	eosio_assert_code(d.begin()!=d.end(), NOT_FOUND);
	for (auto it=d.begin(); it!=d.end(); ++it) {
		if (it->cdraftid==cdraftid) continue;
		auto found = std::find(it->tokenlist.begin(), it->tokenlist.end(), tokenid);
		if (found!=it->tokenlist.end()) {
			return true;
		}
	}
	return false;
}

void Mypher::issue_token(const eosio::name& sender, const uint64_t& cipherid,
			   const uint64_t& tokenid, const eosio::name& recipient, const uint64_t& quantity) {
	// check limit
	eosio_assert_code(get_available_amount(tokenid)>=quantity, INSUFFICIENT_AMOUNT);
	// check token issuer
	auto rec = token_data.find(tokenid);
	eosio_assert_code(rec!=token_data.end(), NOT_FOUND);
	eosio_assert_code(rec->issuer==cipherid, TOKEN_NOT_OWNED_BY_SENDER);
	// check specified recipient
	eosio_assert_code(is_person_exists(recipient), INVALID_RECIPIENT);
	// issue the token
	set_amount(sender, tokenid, recipient, quantity);
}

void Mypher::tktransfer(const eosio::name sender, 
				const uint64_t tokenid, const eosio::name recipient, const uint64_t quantity) {
	// check the receiver
	eosio_assert_code(is_person_exists(recipient), INVALID_RECIPIENT);
	issued_def d(_self, tokenid);
	auto idx = d.get_index<KEY2>();
	auto rec = idx.find(sender.value);
	// check if sender's amount is enough to send 
	eosio_assert_code(rec!=idx.end(), INSUFFICIENT_AMOUNT);
	eosio_assert_code(rec->quantity>=quantity, INSUFFICIENT_AMOUNT);
	// transfer the token
	idx.modify(rec, sender, [&](auto& dd) {
		dd.quantity -= quantity;
	});
	set_amount(sender, tokenid, recipient, quantity);
}

void Mypher::tkuse(const eosio::name sender, const uint64_t tokenid, const uint64_t quantity) {
	issued_def d2(_self, tokenid);
	auto idx = d2.get_index<KEY2>();

	auto rec = token_data.find(tokenid);
	eosio_assert_code(rec!=token_data.end(), NOT_FOUND);
	auto rec2 = idx.find(sender.value);
	eosio_assert_code(rec2!=idx.end(), TOKEN_NOT_OWNED_BY_SENDER);
	can_use(*rec, *rec2, quantity);

	switch (rec->type) {
	case Type::NONE:
		break;
	case Type::PUBLISH_QRCODE:
		eosio_assert_code(0, NOT_IMPLEMENT_YET);
		break;
	case Type::DISTRIBUTE_TOKEN:
		distribute(sender, rec->issuer, rec->extokenid, rec->nofdesttoken);
		break;
	case Type::DISTRIBUTE_CRYPTOCURRENCY:
		eosio_assert_code(0, NOT_IMPLEMENT_YET);
	}
}

void Mypher::tkreqpay(const eosio::name& sender, const uint64_t& tokenid, const uint64_t& quantity, 
	const name& proposal_name, const vector<eosio::name>& approvals) {
	
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	issued_def d2(_self, tokenid);

	auto idx = d2.get_index<KEY2>();
	auto rec = token_data.find(tokenid);
	eosio_assert_code(rec!=token_data.end(), NOT_FOUND);
	auto rec2 = idx.find(sender.value);
	for (; rec2!=idx.end(); ++rec2) {
		if (rec2->payinf==""_n) {
			break;
		}
		eosio_assert_code(rec2->owner==sender, TOKEN_NOT_OWNED_BY_SENDER);
	}
	eosio_assert_code(rec2!=idx.end(), TOKEN_NOT_OWNED_BY_SENDER);
	can_use(*rec, *rec2, quantity);
	eosio_assert_code(rec->type==Type::DISTRIBUTE_CRYPTOCURRENCY, INVALID_PARAM);
	idx.modify(rec2, sender, [&]( auto& a) {
		a.quantity -= quantity;
	});
	auto prikey = d2.available_primary_key();
	d2.emplace(sender, [&](auto& a) {
		a.issueid = prikey;
		a.owner = sender;
		a.quantity = quantity;
		a.status = REQPAY;
		a.payinf = proposal_name;
	});

	auto rec3 = cformal_data.find(rec->issuer);
	eosio_assert_code(rec3!=cformal_data.end(), NOT_FOUND);
	//action propose;
	string memo("token#");
	char tmp[17];
	Prim::itoa16(tmp, tokenid);
	memo += tmp;
	sendProposeAction(
		rec3->multisig, proposal_name, sender, quantity*rec->nofdesteos, memo, approvals);
}


void Mypher::tkgetpay(const eosio::name& sender, const uint64_t& tokenid, const name& proposal_name) {
	// check if sender is login user
	require_auth(sender);
	issued_def d(_self, tokenid);
	auto idx = d.get_index<KEY2>();
	auto rec = idx.find(sender.value);
	for (; rec!=idx.end(); ++rec) {
		if (rec->payinf==proposal_name) {
			break;
		}
	}
	eosio_assert_code(rec!=idx.end(), NOT_FOUND);
	exec_multisig(sender, proposal_name);
	idx.erase(rec);
}

void Mypher::can_use(const token& tok, const issued& isu, const uint64_t quantity) {
	eosio_assert_code(isu.quantity>=quantity, INSUFFICIENT_AMOUNT);
	switch (tok.when) {
	case When::UNALLOW:
		eosio_assert_code(0, NOT_FULFILL_REQUIREMENT);
	case When::COMPLETE_TASK:
		eosio_assert_code(is_results_approved(tok.taskid), NOT_FULFILL_REQUIREMENT);
		break;
	case When::OVER_ISSUER_OWNED_TOKEN:
		eosio_assert_code(is_sufficient_owned_token(tok.issuer, tok.extokenid, tok.reftoken), NOT_FULFILL_REQUIREMENT);
		break;
	case When::ALWAYS:
		// always allow
		break;
	case When::FLAG:
		eosio_assert_code(0, NOT_IMPLEMENT_YET);
	}
}

void Mypher::distribute(const eosio::name sender, const uint64_t cipherid,  
					const uint64_t tokenid, const uint64_t quantity) {
	eosio_assert_code(0, NOT_IMPLEMENT_YET);
}

uint64_t Mypher::get_available_amount(const uint64_t tokenid) {
	issued_def d2(_self, tokenid);

	auto rec = token_data.find(tokenid);
	if (rec==token_data.end()) {
		return 0;
	}
	uint64_t used = 0;
	for (auto it=d2.begin(); it!=d2.end(); ++it) {
		used += it->quantity;
	}
	return rec->limit - used;
}

bool Mypher::is_issued(const uint64_t tokenid) {
	issued_def d(_self, tokenid);
	return (d.begin()!=d.end());
}

void Mypher::set_amount(const eosio::name sender, const uint64_t tokenid, const eosio::name user, const uint64_t quantity) {
	issued_def d(_self, tokenid);
	auto idx = d.get_index<KEY2>();
	auto rec = idx.find(user.value);
	// first time to issue to specified receiver
	if (rec==idx.end()) {
		uint64_t id = d.available_primary_key();
		d.emplace(sender, [&](auto& dd) {
			dd.issueid = id;
			dd.owner = user;
			dd.quantity = quantity;
		});
	} else {
		idx.modify(rec, sender, [&](auto& dd) {
			dd.quantity += quantity;
		});
	}
	auto prec = person_data.find(user.value);
	if (prec!=person_data.end()) {
		person_data.modify(prec, sender, [&](auto& dd) {
			auto found = std::find(dd.tokenlist.begin(), dd.tokenlist.end(), tokenid);
			if (found==dd.tokenlist.end()) {
				dd.tokenlist.push_back(tokenid);
			}
		});
	}
}

bool Mypher::is_sufficient_owned_token(const uint64_t issuer, const uint64_t tokenid, const uint64_t amount) {
	return (get_available_amount(tokenid) > amount);
}

bool Mypher::is_token_exists(const uint64_t tokenid) {
	return (token_data.begin()!=token_data.end());
}

void Mypher::check_tokenowner(const uint64_t& tokenid, const uint64_t& cipherid) {
		
	auto rec = token_data.find(tokenid);
	// check if data exists
	eosio_assert_code(rec!=token_data.end(), INVALID_PARAM);
	eosio_assert_code(rec->issuer==cipherid, TOKEN_NOT_OWNED_BY_SENDER);
}