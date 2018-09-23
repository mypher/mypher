// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef CONTRACT_HPP
#define CONTRACT_HPP

#include <eosiolib/eosio.hpp>
#include "person.hpp"
#include "cipher.hpp"

using namespace eosio;
using namespace std;


class Mypher : public contract, public mypher::Person, public mypher::Cipher {

public:

	/**
	 * @brief information of person
	 */
/*	struct [[eosio::table]] person {
		uint64_t id;
		string name;
		string profile;

		auto primary_key() const { return id; }

		EOSLIB_SERIALIZE( person, (id)(name)(profile) )
	};*/

	/**
	 * @brief information of cipher
	 */
/*	struct [[eosio::table]] cipher {
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
		
		EOSLIB_SERIALIZE( row, 
			(id)(cipherid)(version)(draftno)(name)(purpose)(drule_req)(drule_auth)
			(approved)(editor)(formal)(ctime)(utime)
		)
	};*/

	/**
	 * @brief create new cipher
	 */
//	[[eosio::action]]
//	void cipher_create(const string& sender, const string& name, const string& purpose,
//				const uint16_t& drule_req, const string& drule_auth, const string& editor);

	/**
	 * @brief create new person
	 */
//	[[eosio::action]]
//	void person_create(const string& name, const string& profile);

	Mypher(account_name self) 
	: contract(self), mypher::Person(self), mypher::Cipher(self)
	{}  
};

#endif // CIPHER_HPP