// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef COMMON_VALIDATOR_HPP
#define COMMON_VALIDATOR_HPP

#include <eosiolib/eosio.hpp>


using namespace std;
using namespace eosio;

class Validator {
public:
	static void check_hash(const string& hash);
	//static void check_cipher(const uint64_t id);
};


#endif // COMMON_VALIDATOR_HPP
