// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef CIPHER_HPP
#define CIPHER_HPP

#include <eosiolib/eosio.hpp>

namespace mypher {

using namespace std;

/**
 * @defgroup mypher
 * @class cipher
 * @brief the contract for managing a group named "cipher"
 */
class Cipher {
private:
	account_name self;

public:
	Cipher(account_name _self) {
		self = _self;
	};

	/**
	 * @brief information of cipher
	 */
	struct [[eosio::table]] cipher {
		account_name id;
		uint64_t cipherid;
		uint16_t version;
		uint16_t draftno;
		string name;
		string purpose;
		uint16_t drule_req;
		string drule_auth;
		string approved;
		string editor;
		bool formal;
		uint64_t ctime;
		uint64_t utime;

		auto primary_key() const { return id; }
		
		EOSLIB_SERIALIZE( cipher, 
			(id)(cipherid)(version)(draftno)(name)(purpose)(drule_req)(drule_auth)
			(approved)(editor)(formal)(ctime)(utime)
		)
	};

	/**
	 * @brief the definition of the table for "cipher"
	 */
	typedef eosio::multi_index< N(cipher), cipher> data;

	/**
	 * @brief create new cipher
	 */
	[[eosio::action]]
	void ccreate(const string& sender, const string& name, const string& purpose,
				const uint16_t& drule_req, const string& drule_auth, const string& editor);
};

} // mypher
#endif // CIPHER_HPP