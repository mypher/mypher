// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include <boost/range/iterator_range.hpp>
#include "../token.hpp"
#include "../cipher.hpp"
#include "messageid.h"
#include "validator.hpp"

using namespace eosio;
using namespace std;

namespace mypher {

void Validator::check_tokenowner(const uint64_t tokenid, const uint64_t cipherid) {
		
	Token::token_data d(SELF, SELF);
	auto rec = d.find(tokenid);
	// check if data exists
	eosio_assert_code(rec!=d.end(), INVALID_PARAM);
	eosio_assert_code(rec->issuer==cipherid, TOKEN_NOT_OWNED_BY_SENDER);
}

void Validator::check_hash(const string& hash) {
	// TODO:
}

} // mypher
