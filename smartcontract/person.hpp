// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef PERSON_HPP
#define PERSON_HPP

#include <eosiolib/eosio.hpp>
#include "validator/vperson.hpp"
#include "validator/vcommon.hpp"
#include "common/messageid.h"

namespace mypher {

using namespace std;
using namespace eosio;

/**
 * @defgroup mypher
 * @class cipher
 * @brief the contract for managing a group named "cipher"
 */
class Person {
private:
	const static size_t MINLEN_NAME = 1;
	const static size_t MAXLEN_NAME = 32;
public:
	/**
	 * @brief information of person
	 */
	struct [[eosio::table]] person {
		uint64_t id;
		string name;
		string profile;

		auto primary_key() const { return id; }

		EOSLIB_SERIALIZE( person, (id)(name)(profile) )
	};
	/**
	 * @brief the definition of the table for "person"
	 */
	typedef eosio::multi_index< N(person), person> data;
	account_name owner;
	Person(account_name self);

	/**
	 * @brief create new person
	 */
	[[eosio::action]]
	void pcreate(const string& name, const string& profile);

};

} // mypher

#endif // PERSON_HPP