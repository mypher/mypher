// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef VALIDATOR_VCOMMON_HPP
#define  VALIDATOR_VCOMMON_HPP

#include <stdint.h>
#include <string>
#include <regex>
#include <eosiolib/eosio.hpp>

using namespace std;

namespace mypher {

class vcommon {
public:
	static bool chkLen(const string& src, const size_t& min, const size_t& max);
	static bool chkMember(const account_name& self, const std::vector<std::string>& list);
	static bool isExist(const account_name& self, const account_name& id);
};

} // namespace 

#endif //  VALIDATOR_VCOMMON_HPP