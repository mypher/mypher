// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>

void Mypher::pupdate(const eosio::name personid, const string& pname, const std::vector<std::string>& tags, const std::string& hash) {
	require_auth(personid);

	// search the target data
	auto to = person_data.find(personid.value);
	// if data is not registered
	if (to == person_data.end()) {
		// register the attributes
		person_data.emplace(personid, [&](auto& dd) {
			dperson_data.personid = personid;
			dperson_data.pname = pname;
			dperson_data.tags = tags;
			dperson_data.hash = hash;
		});
	} else {
		// update the attributes
		person_data.modify(to, personid, [&](auto& dd) {
			dperson_data.pname = pname;
			dperson_data.tags = tags;
			dperson_data.hash = hash;
		});	
	}
}

bool Mypher::check_list(const vector<eosio::name>& list) {
	person_data d(SELF, SELF);

	vector<eosio::name> sort;
	for (auto it = list.begin(); it != list.end(); ++it ) {
		sort.push_back(*it);
	}
	std::sort(sort.begin(), sort.end());

	eosio::name prev = ""_n;
	for (auto it = list.begin(); it != list.end(); ++it ) {
		if (*it==prev) return false; // if there is duplicate data, invalid
		auto elm = d.find(*it);
		if (elm == d.end()) return false; // if there is unregistered account, invalid
		prev = *it;
	}
	return true;
}

bool Mypher::exists(const eosio::name user) {
	person_data d(SELF, SELF);
	return d.find(user)!=d.end();
}

