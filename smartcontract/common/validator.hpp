// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef COMMON_VALIDATOR_HPP
#define COMMON_VALIDATOR_HPP

#include <eosiolib/eosio.hpp>


using namespace std;
using namespace eosio;

namespace mypher {

class Validator {
public:
	static void check_tokenowner(const uint64_t id, const account_name owner, const uint32_t cipherid);
	static void check_hash(const string& hash);
	static void check_cipher(const uint64_t id);
};

}

#endif // COMMON_VALIDATOR_HPP