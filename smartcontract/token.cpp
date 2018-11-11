// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>

namespace mypher {

Token::Token(account_name _self) {
	self = _self;
}

void Token::tknew(const account_name sender, const string& name, const account_name issuer, 
			   const uint64_t issuer2, const uint32_t limit, const uint8_t when,
			   const uint8_t type, const uint64_t taskid, const uint64_t tokenid,
			   const uint32_t reftoken, const string& term, const uint8_t rcalctype,
			   const uint32_t nofdevtoken ) {
	eosio::print("##1", sender);
	require_auth(sender);
	data d(self, self);
	uint64_t id = d.available_primary_key();
	eosio::print("###", sender, ":", id);
	d.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.name = name;
		dd.issuer = issuer;
		dd.issuer2 = issuer2;
		dd.limit = limit;
		dd.when = when;
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