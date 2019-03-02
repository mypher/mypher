// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>
#include "common/validator.hpp"
#include "cipher.hpp"
#include "person.hpp"
#include "task.hpp"

namespace mypher {

void Token::tknew(const account_name sender, const uint64_t cdraftid,
			   const string& name, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken, 
			   const uint8_t rcalctype, const uint64_t nofdesttoken, const double_t nofdesteos) {

	token_data d(self, self);
	uint64_t id = d.available_primary_key();
	// common check
	check_data(sender, name, issuer, limit, when, disposal, type, 
			taskid, extokenid, reftoken, rcalctype, nofdesttoken, nofdesteos);
	// create new token
	d.emplace(sender, [&](auto& dd) {
		dd.tokenid = id;
		dd.name = name;
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
	Cipher::cdraft_data d2(self, issuer);
	auto rec = d2.find(cdraftid);
	eosio_assert_code(rec!=d2.end(), NOT_FOUND);
	eosio_assert_code(Cipher::is_draft_version(issuer, rec->version), ALREADY_FORMAL);
	// append token to cipher
	d2.modify(rec, sender, [&](auto& dd){
		dd.tokenlist.push_back(id);	
	});
}

void Token::tkupdate(const account_name sender, const uint64_t cdraftid,
			   const uint64_t tokenid,
			   const string& name, const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint32_t reftoken,  
			   const uint8_t rcalctype, const uint32_t nofdesttoken, double_t nofdesteos ) {

	token_data d(self, self);
	auto rec = d.find(tokenid);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);

	// check if token already issued
	eosio_assert_code(!is_issued(tokenid), TOKEN_ALREADY_ISSUED);

	// check if specified cid is valid	
	check_data(sender, name, rec->issuer, limit, when, disposal, type, 
			taskid, extokenid, reftoken, rcalctype, nofdesttoken, nofdesteos);

	// if specified token is shared between some drafts, generates copy of the draft
	if (is_shared(tokenid, rec->issuer, cdraftid)) {
		uint64_t id = d.available_primary_key();
		d.emplace(sender, [&](auto& dd) {
			dd.tokenid = id;
			dd.name = name;
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
		Cipher::cdraft_data cd(self, rec->issuer);
		auto crec = cd.find(cdraftid);
		eosio_assert_code(Cipher::is_draft_version(rec->issuer, crec->version), ALREADY_FORMAL);
		eosio_assert_code(crec!=cd.end(), INVALID_PARAM); 
		cd.modify(crec, sender, [&](auto& dd){
			std::replace(dd.tokenlist.begin(), dd.tokenlist.end(), rec->tokenid, id);
		});
	} else {
		d.modify(rec, sender, [&](auto& dd){
			dd.name = name;
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

void Token::check_data( const account_name sender, 
			   const string& name, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken,
			   const uint8_t rcalctype, const uint64_t nofdesttoken,
			   const double_t nofdesteos ) {

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
		eosio_assert_code(Task::exists(issuer, taskid), INVALID_PARAM);
	}
	// check if token is exists
	if (extokenid!=NUMBER_NULL) {
		eosio_assert_code(Token::exists(extokenid), INVALID_PARAM);
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

bool Token::is_shared(const uint64_t tokenid, const uint64_t cipherid, const uint64_t cdraftid) {
	Cipher::cdraft_data d(SELF, cipherid);
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

void Token::issue(const account_name sender, const uint64_t cipherid,
			   const uint64_t tokenid, const account_name recipient, const uint64_t quantity) {
	// check limit
	eosio_assert_code(get_available_amount(tokenid)>=quantity, INSUFFICIENT_AMOUNT);
	// check token issuer
	token_data d(SELF, SELF);
	auto rec = d.find(tokenid);
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	eosio_assert_code(rec->issuer==cipherid, TOKEN_NOT_OWNED_BY_SENDER);
	// check specified recipient
	eosio_assert_code(Person::exists(recipient), INVALID_RECIPIENT);
	// issue the token
	set_amount(sender, tokenid, recipient, quantity);
}

void Token::tktransfer(const account_name sender, 
				const uint64_t tokenid, const account_name recipient, const uint64_t quantity) {
	// check the receiver
	eosio_assert_code(Person::exists(recipient), INVALID_RECIPIENT);
	issued_data d(self, tokenid);
	auto idx = d.get_index<N(secondary_key)>();
	auto rec = idx.find(sender);
	// check if sender's amount is enough to send 
	eosio_assert_code(rec!=idx.end(), INSUFFICIENT_AMOUNT);
	eosio_assert_code(rec->quantity>=quantity, INSUFFICIENT_AMOUNT);
	// transfer the token
	idx.modify(rec, sender, [&](auto& dd) {
		dd.quantity -= quantity;
	});
	set_amount(sender, tokenid, recipient, quantity);
}

void Token::tkuse(const account_name sender, const uint64_t tokenid, const uint64_t quantity) {
	token_data d(self, self);
	issued_data d2(self, tokenid);
	auto idx = d2.get_index<N(secondary_key)>();

	auto rec = d.find(tokenid);
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	auto rec2 = idx.find(sender);
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

// it is the premise that eosio.msig::propose is called in the same set of transactions
void Token::tkreqpay(const account_name sender, const uint64_t tokenid, const uint64_t quantity, const account_name proposal_name) {
	token_data d(self, self);
	issued_data d2(self, tokenid);
	auto idx = d2.get_index<N(secondary_key)>();
	auto rec = d.find(tokenid);
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	auto rec2 = idx.find(sender);
	eosio_assert_code(rec2!=idx.end(), TOKEN_NOT_OWNED_BY_SENDER);
	can_use(*rec, *rec2, quantity);
	eosio_assert_code(rec->type==Type::DISTRIBUTE_CRYPTOCURRENCY, INVALID_PARAM);
	idx.modify(rec2, sender, [&]( auto& a) {
		a.quantity -= quantity;
	});
	auto prikey = d2.available_primary_key();
	d2.emplace( sender, [&]( auto& a) {
		a.issueid = prikey;
		a.owner = sender;
		a.quantity = quantity;
		a.status = REQPAY;
		a.payinf = proposal_name;
	});
}

void Token::can_use(const token& tok, const issued& isu, const uint64_t quantity) {
	eosio_assert_code(isu.quantity>=quantity, INSUFFICIENT_AMOUNT);
	switch (tok.when) {
	case When::UNALLOW:
		eosio_assert_code(0, NOT_FULFILL_REQUIREMENT);
	case When::COMPLETE_TASK:
		eosio_assert_code(Task::is_results_approved(tok.taskid), NOT_FULFILL_REQUIREMENT);
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

void Token::distribute(const account_name sender, const uint64_t cipherid,  
					const uint64_t tokenid, const uint64_t quantity) {
	eosio_assert_code(0, NOT_IMPLEMENT_YET);
}
/*
void Token::transfer_currency(const account_name sender, 
				const account_name issuer, const uint32_t issuer2, const uint32_t quantity) {
	// TODO:
	action(
		permission_level {sender,N(active)},
        N(eosio.token),N(transfer),
        std::make_tuple(self,N(eosio.token),asset(quantity,N(eos)),"")
	).send();
}*/

uint64_t Token::get_available_amount(const uint64_t tokenid) {
	token_data d(SELF, SELF);
	issued_data d2(SELF, tokenid);

	auto rec = d.find(tokenid);
	if (rec==d.end()) {
		return 0;
	}
	uint64_t used = 0;
	for (auto it=d2.begin(); it!=d2.end(); ++it) {
		used += it->quantity;
	}
	return rec->limit - used;
}

bool Token::is_issued(const uint64_t tokenid) {
	issued_data d(SELF, tokenid);
	return (d.begin()!=d.end());
}

void Token::set_amount(const account_name sender, const uint64_t tokenid, const account_name user, const uint64_t quantity) {
	issued_data d(SELF, tokenid);
	auto idx = d.get_index<N(secondary_key)>();
	auto rec = idx.find(user);
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
	Person::person_data pd(SELF, SELF);
	auto prec = pd.find(user);
	if (prec!=pd.end()) {
		pd.modify(prec, sender, [&](auto& dd) {
			auto found = std::find(dd.tokenlist.begin(), dd.tokenlist.end(), tokenid);
			if (found==dd.tokenlist.end()) {
				dd.tokenlist.push_back(tokenid);
			}
		});
	}
}

bool Token::is_sufficient_owned_token(const uint64_t issuer, const uint64_t tokenid, const uint64_t amount) {
	return (get_available_amount(tokenid) > amount);
}

bool Token::exists(const uint64_t tokenid) {
	token_data d(SELF, SELF);
	return (d.begin()!=d.end());
}

} // mypher
