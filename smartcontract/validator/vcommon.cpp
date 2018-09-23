// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "vcommon.hpp"
#include "../person.hpp"

namespace mypher {

bool vcommon::chkLen(const string& src, const size_t& min, const size_t& max) {
	size_t len = src.length();
	return !(len>max || len<min);
}

/*bool vcommon::match(const string& src, const std::regex& r) {
	std::smatch match;
	return std::regex_match(src, match, r);
}*/

bool vcommon::chkMember(const account_name& self, const std::vector<std::string>& list) {
	Person::data d(self, N(person));
	for(auto itr = list.begin(); itr != list.end(); ++itr) {
		auto itr2 = d.find(N(*itr));
		if (itr2 == d.end()) {
			return false;
		}
	}	
	return true;
}

bool vcommon::isExist(const account_name& self, const account_name& id) {
	Person::data d(self, N(person));
	auto itr = d.find(id);
	return (itr != d.end());
}

} // namespace
