// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>

namespace mypher {

void Person::pupdate(const account_name id, const string& name, const std::vector<std::string>& tags, const std::string& info) {
	//require_auth(permission_level{id, N(owner)});
	require_auth(id);

	data d(self, self);
	// search the target data
	auto to = d.find(id);
	// if data is not registered
	if (to == d.end()) {
		eosio::print("###not found", id);
		// register the attributes
		d.emplace(id, [&](auto& dd) {
			dd.id = id;
			dd.name = name;
			dd.tags = tags;
			dd.info = info;
		});
	} else {
		eosio::print("###found", id);
		// update the attributes
		d.modify(to, id, [&](auto& dd) {
			dd.name = name;
			dd.tags = tags;
			dd.info = info;
		});	
	}
}

} // mypher