// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>
#include <eosiolib/asset.hpp>
#include "common/validator.hpp"
#include "cipher.hpp"
#include "person.hpp"
#include "task.hpp"

namespace mypher {

void Token::tknew(const account_name sender, const uint64_t draftid,
			   const string& name, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint64_t reftoken, 
			   const uint8_t rcalctype, const uint64_t nofdesttoken, const float64_t nofdesteos) {

	token_data d(self, self);
	uint64_t id = d.available_primary_key();
	// common check
	checkdata(sender, name, issuer, limit, when, disposal, type, 
			taskid, tokenid, reftoken, rcalctype, nofdesttoken, nofdesteos);
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
		dd.tokenid = tokenid;
		dd.reftoken = reftoken;
		dd.rcalctype = rcaltype;
		dd.nofdesttoken = nofdesttoken;
		dd.nofdesteos = nofdesteos;
	});
	// update cipher information
	Cipher::cdraft_data d2(self, issuer);
	auto rec = d2.find(draftid);
	eosio_assert_code(crec!=cd.end(), CIPHER_NOT_FOUND);
	// append token to cipher
	d2.modify(rec, sender, [&](auto& dd){
		dd.tokenlist.push_back(id);	
	});
}

void Token::tkupdate(const account_name sender, 
			   const uint64_t cid, const uint64_t id,
			   const string& name, const account_name issuer, 
			   const uint32_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken ) {
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);

	// check if token already issued
	eosio_assert_code(!is_issued(id), TOKEN_ALREADY_ISSUED);

	// check if specified cid is valid	
	Cipher::data cd(self, self);
	auto crec = cd.find(cid);
	if (cid!=NUMBER_NULL) {
		eosio_assert_code(crec->cipherid==rec->issuer2, CIPHER_NOT_FOUND);
		checkdata(sender, cid, name, issuer, limit, when, disposal, type, 
			taskid, tokenid, reftoken, term, rcalctype, nofdevtoken, crec->editors);
	} else {
		checkdata(sender, cid, name, issuer, limit, when, disposal, type, 
			taskid, tokenid, reftoken, term, rcalctype, nofdevtoken, vector<account_name>{});
	}

	// if task is shared between some drafts, generates copy
	if (is_shared(id, cid)) {
		uint64_t id = d.available_primary_key();
		d.emplace(sender, [&](auto& dd) {
			dd.id = id;
			dd.name = name;
			dd.issuer = rec->issuer;
			dd.issuer2 = rec->issuer2;
			dd.limit = limit;
			dd.when = when;
			dd.disposal = disposal;
			dd.type = type;
			dd.taskid = taskid;
			dd.tokenid = tokenid;
			dd.reftoken = reftoken;
			dd.term = term;
			dd.rcalctype = rcalctype;
			dd.nofdevtoken = nofdevtoken;
		});
		// update the id registered in cipher to new one
		cd.modify(crec, sender, [&](auto& dd){
			std::replace(dd.tokenlist.begin(), dd.tokenlist.end(), rec->id, id);
		});
	} else {
		d.modify(rec, sender, [&](auto& dd){
			dd.name = name;
			dd.limit = limit;
			dd.when = when;
			dd.disposal = disposal;
			dd.type = type;
			dd.taskid = taskid;
			dd.tokenid = tokenid;
			dd.reftoken = reftoken;
			dd.term = term;
			dd.rcalctype = rcalctype;
			dd.nofdevtoken = nofdevtoken;
		});
	}
}

void Token::checkdata( const account_name sender, 
			   const string& name, const uint64_t issuer, 
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint64_t reftoken,
			   const uint8_t rcalctype, const uint64_t nofdesttoken,
			   const float64_t nofdesteos ) {

	// check if sender is login user
	require_auth(sender);
	// check if "type" is valid
	eosio_assert_code(type>=0&&type<TYPE_MAX, INVALID_VALUE);
	// check if "when" is valid
	eosio_assert_code(when>=0&&type<WHEN_MAX, INVALID_VALUE);
	// check if "disposal" is valid
	eosio_assert_code(disposal>=0&&disposal<DISPOSAL_MAX, INVALID_VALUE);
	// check is task is exists
	if (taskid!=NUMBER_NULL) [

	]
	// check if token is exists
	if (tokenid!=NUMBER_NULL) {
		// check if reftoken is set 
		
	}
	// check if tokenid and nofdesttoken is set if type is "DISTRIBUTE_TOKEN"
	// check if 
}

bool Token::is_shared(const uint64_t id, const uint64_t cid) {
	if (cid==NUMBER_NULL) return false;
	Cipher::data d(SELF, SELF);
	auto rec = d.find(cid);
	eosio_assert_code(rec!=d.end(), CIPHER_NOT_FOUND);
	for (auto it=d.begin(); it!=d.end(); ++it) {
		if (it->id==cid) continue;
		auto found = std::find(it->tokenlist.begin(), it->tokenlist.end(), id);
		if (found!=it->tokenlist.end()) return true;
	}
	return false;
}

void Token::issue(const account_name sender, const uint32_t cipherid,
			   const uint64_t tokenid, const account_name receiver, const uint32_t quantity) {
	// if issued by a cipher, check if there is this token in formal version of it 
	if (cipherid!=NUMBER_NULL) {
		// TODO:
	}
	// check limit
	eosio_assert_code(getAvailableAmount(tokenid)>=quantity, INSUFFICIENT_AMOUNT);
	// check token issuer
	data d(SELF, SELF);
	auto rec = d.find(tokenid);
	eosio_assert_code(rec!=d.end(), INVALID_TOKEN);
	if (cipherid!=NUMBER_NULL) {
		eosio::print("issue1:", rec->issuer2, ":", cipherid);
		eosio_assert_code(rec->issuer2==cipherid, TOKEN_NOT_OWNED_BY_SENDER);
	} else {
		eosio::print("issue2:", rec->issuer, ":", sender);
		eosio_assert_code(rec->issuer==sender, TOKEN_NOT_OWNED_BY_SENDER);
	}
	// check the receiver
	eosio_assert_code(Person::isExists(receiver), INVALID_RECEIVER);
	// issue the token
	set_amount(sender, tokenid, receiver, quantity);
}

void Token::tktransfer(const account_name sender, 
				const uint64_t tokenid, const account_name receiver, const uint32_t quantity) {
	// check the receiver
	eosio_assert_code(Person::isExists(receiver), INVALID_RECEIVER);
	data2 d2(self, tokenid);
	auto rec2 = d2.find(sender);
	// check if sender's amount is enough to send 
	eosio_assert_code(rec2!=d2.end(), INSUFFICIENT_AMOUNT);
	eosio_assert_code(rec2->quantity>=quantity, INSUFFICIENT_AMOUNT);
	// transfer the token
	d2.modify(rec2, sender, [&](auto& dd) {
		dd.quantity -= quantity;
	});
	set_amount(sender, tokenid, receiver, quantity);
}
void Token::tkuse(const account_name sender, const uint64_t tokenid, const uint32_t quantity) {
	eosio::print("##Token:use");
	data d(self, self);
	data d2(self, tokenid);

	auto rec = d.find(tokenid);
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	auto rec2 = d2.find(sender);
	eosio_assert_code(rec2!=d2.end(), TOKEN_NOT_OWNED_BY_SENDER);
	switch (rec->when) {
	case When::UNALLOW:
		eosio_assert_code(0, NOT_FULFILL_REQUIREMENT);
	case When::COMPLETE_TASK:
		eosio_assert_code(Task::is_completed(rec->taskid), NOT_FULFILL_REQUIREMENT);
		break;
	case When::OVER_ISSUER_OWNED_TOKEN:
		eosio_assert_code(is_sufficient_owned_token(rec->issuer, rec->issuer2, rec->tokenid, rec->reftoken), NOT_FULFILL_REQUIREMENT);
		break;
	case When::ALWAYS:
		// always allow
		break;
	case When::FLAG:
		eosio_assert_code(0, NOT_IMPLEMENT_YET);
	}

	switch (rec->type) {
	case Type::NONE:
		break;
	case Type::PUBLISH_QRCODE:
		eosio_assert_code(0, NOT_IMPLEMENT_YET);
		break;
	case Type::DISTRIBUTE_TOKEN:
		distribute(sender, rec->issuer2, rec->issuer, rec->tokenid, rec->nofdevtoken);
		break;
	case Type::DISTRIBUTE_CRYPTOCURRENCY:
		eosio_assert_code(0, NOT_IMPLEMENT_YET);
	}
}

void Token::distribute(const account_name sender, const uint32_t dcipherid, const account_name duserid, 
					const uint64_t tokenid, const uint32_t quantity) {
	
}

void Token::send_currency(const account_name sender, 
				const account_name issuer, const uint32_t issuer2, const uint32_t quantity) {
	// TODO:
	action(
		permission_level {sender,N(active)},
        N(eosio.token),N(transfer),
        std::make_tuple(self,N(eosio.token),asset(quantity,N(eos)),"")
	).send();
}

uint32_t Token::getAvailableAmount(const uint64_t id) {
	data d(SELF, SELF);
	data2 d2(SELF, id);

	auto rec = d.find(id);
	if (rec==d.end()) {
		return 0;
	}
	uint32_t used = 0;
	for (auto it=d2.begin(); it!=d2.end(); ++it) {
		used += it->quantity;
	}
	return rec->limit - used;
}

bool Token::is_issued(const uint64_t id) {
	data2 d2(SELF, id);
	return (d2.begin()!=d2.end());
}

void Token::set_amount(const account_name sender, const uint64_t tokenid, const account_name user, const uint32_t quantity) {
	data2 d2(SELF, tokenid);
	auto rec2 = d2.find(user);
	// first time to issue to specified receiver
	if (rec2==d2.end()) {
		d2.emplace(sender, [&](auto& dd) {
			dd.owner = user;
			dd.quantity = quantity;
		});
	} else {
		d2.modify(rec2, sender, [&](auto& dd) {
			dd.quantity += quantity;
		});
	}
	Person::data pd(SELF, SELF);
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

bool Token::is_sufficient_owned_token(account_name issuer, uint64_t issuer2, uint64_t tokenid, uint32_t amount) {
	if (issuer2!=NUMBER_NULL) {
		return (getAvailableAmount(tokenid) > amount);
	} else {
		data2 d2(SELF, tokenid);
		auto rec2 = d2.find(issuer);
		if (rec2==d2.end()) {
			return false;
		}
		return (rec2->quantity>=amount);
	}
}

} // mypher