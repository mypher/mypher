// Copyright (C) 2018 The Mypher Authors
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

void Validator::check_tokenowner(
	const uint64_t id, const account_name owner, const uint64_t cipherid) {
	// is tokenid is not set, validation is not needed
	if (id==NUMBER_NULL) return;

	Token::data d(SELF, SELF);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), INVALID_TOKENID);
	// check token owner
	if (owner==N("")) {
		eosio_assert_code(rec->issuer2==cipherid, TOKEN_NOT_OWNED_BY_SENDER);
	} else {
		eosio_assert_code(rec->issuer==owner, TOKEN_NOT_OWNED_BY_SENDER);
	}
}

void Validator::check_hash(const string& hash) {
	// TODO:
}

void Validator::check_cipher(const uint64_t id) {
	if (id==NUMBER_NULL) return;

	Cipher::data d(SELF, SELF);
	auto rec = d.find(id);
	eosio_assert_code(rec!=d.end(), CIPHER_NOT_FOUND);
	eosio_assert_code(!rec->formal, CIPHER_NOT_DRAFT);
	auto idx = d.get_index<N(secondary_key)>();
	auto lower = idx.lower_bound(Cipher::gen_secondary_key(rec->cipherid, rec->version, 0));
	uint64_t perversion = lower->version;
	for (auto it=lower; it!=idx.end(); ++it) {
		// if there is a formal draft in the same version, it can't be edited 
		eosio_assert_code(it->formal==false, CIPHER_NOT_DRAFT);
		// if there is a newer version in the same cipher, it can'T be edited 
		eosio_assert_code(it->version==perversion, CIPHER_NOT_DRAFT);
		perversion = it->version;
	}
}


} // mypher