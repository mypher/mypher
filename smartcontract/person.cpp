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

void Person::pupdate(const account_name id, const string& name, const std::vector<std::string>& tags, const std::vector<char>& info) {
	//require_auth(permission_level{id, N(owner)});
	require_auth(id);

	data d(owner, owner);
	// search the target data
	auto to = d.find(id);
	// if data is not registered
	if (to == d.end()) {
		// register the attributes
		d.emplace(id, [&](auto& dd) {
			dd.id = id;
			dd.name = name;
			dd.tags = tags;
			dd.info = info;
		});
	} else {
		// update the attributes
		d.modify(to, id, [&](auto& dd) {
			dd.name = name;
			dd.tags = tags;
			dd.info = info;
		});	
	}
}

} // mypher