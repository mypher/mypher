// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>

namespace mypher {

void Token::tknew(const account_name sender, const string& name, const account_name issuer, 
			   const uint64_t issuer2, const uint32_t limit, const uint8_t when,
			   const uint8_t disposal, const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken ) {
	require_auth(sender);
	data d(self, self);
	uint64_t id = d.available_primary_key();
	eosio::print("#token#", sender, ":", id);
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
}
void Token::tkupdate(const account_name sender, const uint64_t id,
			   const string& name, const account_name issuer, 
			   const uint64_t issuer2, const uint32_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken ) {
	// check if sender is logined user
	require_auth(sender);
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert(rec!=d.end(), "DATA_NOT_FOUND");
	// check if data can edit
	if (rec->issuer==N("")) { // cipher
		eosio_assert(false, "NOT IMPLEMENTS YET");
	} else { // individual
		eosio_assert(rec->issuer==sender, "NOT_EDITABLE");	
	}
	// TODO:reject if token already issued
	d.modify(rec, sender, [&](auto& dd){
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
}

} // mypher