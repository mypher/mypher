// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>

namespace mypher {

Person::Person(account_name self) {
	owner = self;
}

void Person::pcreate(const string& name, const string& profile) {
	uint64_t target = string_to_name(name.c_str());
	// chkec if already registered
	eosio_assert(vcommon::isExist(owner, target), MES_ALREADY_REGISTERED);
	uint64_t id = N(person);
	uint64_t v = string_to_name(name.c_str());
	require_auth(permission_level{target, N(owner)});

	data d(owner, id);
	d.emplace(target, [&](auto& dd) {
		dd.id = target;
		dd.name = name;
		dd.profile = profile;
	});
}

} // mypher