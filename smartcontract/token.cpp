// Copyright (C) 2018 The Mypher Authors
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

void Token::tknew(const account_name sender, const uint64_t cid, 
				const string& name, const account_name issuer, 
			   const uint32_t limit, const uint8_t when,
			   const uint8_t disposal, const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken ) {
	data d(self, self);
	uint64_t issuer2 = NUMBER_NULL;
	uint64_t id = d.available_primary_key();
	auto update = [&](const vector<account_name>& editors) {
		eosio::print("#token#", sender, ":", id);
		checkdata(sender, cid, name, issuer, when, limit, disposal, type, 
				taskid, tokenid, reftoken, term, rcalctype, nofdevtoken, editors);
		d.emplace(sender, [&](auto& dd) {
			dd.id = id;
			dd.name = name;
			dd.issuer = issuer;
			dd.issuer2 = issuer2;
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
	};

	eosio::print("##cid#", cid, "\n");
	// if this token is issued by any cipher, check and update that cipher 
	if (cid!=NUMBER_NULL) {
		Cipher::data cd(self, self);
		// check if specified cipher is exists
		auto crec = cd.find(cid);
		eosio_assert_code(crec!=cd.end(), CIPHER_NOT_FOUND);
		issuer2 = crec->cipherid;
		update(crec->editors);
		// append the task to the cipher
		cd.modify(crec, sender, [&](auto& dd){
			dd.tokenlist.push_back(id);	
		});
	} else {
		update(vector<account_name>{});
	}
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

	// TODO:reject if token already issued

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

void Token::checkdata( const account_name sender, const uint64_t cid,
			   const string& name, const account_name issuer, 
			   const uint32_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken,
			   const vector<account_name>& editors ) {

	// check if sender is logined user
	require_auth(sender);

	// check if linked cipher is correct
	Validator::check_cipher(cid);

	// check if issuer is valid
	if (issuer!=N("")) {
		Person::data pd(SELF, SELF);
		auto prec = pd.find(issuer);
		eosio_assert_code(prec!=pd.end(), INVALID_ISSUER);
		eosio_assert_code(issuer==sender, NOT_EDITABLE);	
	}
	
	// check if editors of cid is valid
	if (cid!=NUMBER_NULL) {
		auto found = std::find(editors.begin(), editors.end(), sender);
		eosio_assert_code(found!=editors.end(), INVALID_ISSUER);
	}
}

bool Token::is_shared( const uint64_t tokenid, const uint64_t cid) {
	if (cid==NUMBER_NULL) return false;
	Cipher::data d(SELF, SELF);
	auto rec = d.find(cid);
	eosio_assert_code(rec!=d.end(), CIPHER_NOT_FOUND);
	for (auto it=d.begin(); it!=d.end(); ++it) {
		if (it->id==cid) continue;
		auto found = std::find(it->tokenlist.begin(), it->tokenlist.end(), tokenid);
		if (found!=it->tokenlist.end()) return true;
	}
	return false;
}

} // mypher