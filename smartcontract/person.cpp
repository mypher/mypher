// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>

namespace mypher {

void Person::pupdate(const account_name personid, const string& name, const std::vector<std::string>& tags, const std::string& hash) {
	require_auth(personid);

	person_data d(self, self);
	// search the target data
	auto to = d.find(personid);
	// if data is not registered
	if (to == d.end()) {
		// register the attributes
		d.emplace(personid, [&](auto& dd) {
			dd.personid = personid;
			dd.name = name;
			dd.tags = tags;
			dd.hash = hash;
		});
	} else {
		// update the attributes
		d.modify(to, personid, [&](auto& dd) {
			dd.name = name;
			dd.tags = tags;
			dd.hash = hash;
		});	
	}
}

bool Person::check_list(const vector<account_name>& list) {
	person_data d(SELF, SELF);

	vector<account_name> sort;
	for (auto it = list.begin(); it != list.end(); ++it ) {
		sort.push_back(*it);
	}
	std::sort(sort.begin(), sort.end());

	account_name prev = N("");
	for (auto it = list.begin(); it != list.end(); ++it ) {
		if (*it==prev) return false; // if there is duplicate data, invalid
		auto elm = d.find(*it);
		if (elm == d.end()) return false; // if there is unregistered account, invalid
		prev = *it;
	}
	return true;
}

bool Person::exists(const account_name user) {
	person_data d(SELF, SELF);
	return d.find(user)!=d.end();
}

} // mypher