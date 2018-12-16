// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef PERSON_HPP
#define PERSON_HPP

#include <eosiolib/eosio.hpp>
#include "common/messageid.h"
#include "mypherbase.hpp"

using namespace std;
using namespace eosio;

namespace mypher {

/**
 * @defgroup mypher
 * @class cipher
 * @brief the contract for managing a group named "cipher"
 */
class Person : virtual public MypherBase {
private:
	const static size_t MINLEN_NAME = 1;
	const static size_t MAXLEN_NAME = 32;
public:
	/**
	 * @brief information of person
	 */
	struct [[eosio::table]] person {
		account_name personid;
		string name;
		vector<string> tags;
		string hash;
		vector<uint64_t> tokenlist;

		auto primary_key() const { return personid; }

		EOSLIB_SERIALIZE( person, (personid)(name)(tags)(hash)(tokenlist) )
	};
	/**
	 * @brief the definition of the table for "person"
	 */
	typedef eosio::multi_index<N(person), person> person_data;

	/**
	 * @brief create new person
	 */
	[[eosio::action]]
	void pupdate(const account_name personid, const string& name, const vector<string>& tags, const string& hash);

// common
public:
	static bool check_list(const vector<account_name>& list);
	static bool exists(const account_name user);

};

} // mypher

#endif // PERSON_HPP