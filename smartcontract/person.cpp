// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"
#include <eosiolib/print.hpp>

void Mypher::pupdate(const eosio::name& personid, const string pname, const std::vector<std::string> tags, const std::string hash) {
	require_auth(personid);

	// search the target data
	auto to = person_data.find(personid.value);
	// if data is not registered
	if (to == person_data.end()) {
		// register the attributes
		person_data.emplace(personid, [&](auto& dd) {
			dd.personid = personid;
			dd.pname = pname;
			dd.tags = tags;
			dd.hash = hash;
		});
	} else {
		// update the attributes
		person_data.modify(to, personid, [&](auto& dd) {
			dd.pname = pname;
			dd.tags = tags;
			dd.hash = hash;
		});	
	}
}

bool Mypher::check_person_list(const vector<eosio::name>& list) {

	vector<eosio::name> sort;
	for (auto it = list.begin(); it != list.end(); ++it ) {
		sort.push_back(*it);
	}
	std::sort(sort.begin(), sort.end());

	eosio::name prev = ""_n;
	for (auto it = list.begin(); it != list.end(); ++it ) {
		if (*it==prev) return false; // if there is duplicate data, invalid
		auto elm = person_data.find(it->value);
		if (elm == person_data.end()) return false; // if there is unregistered account, invalid
		prev = *it;
	}
	return true;
}

bool Mypher::is_person_exists(const eosio::name user) {
	return person_data.find(user.value)!=person_data.end();
}

