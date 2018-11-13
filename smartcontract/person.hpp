// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef PERSON_HPP
#define PERSON_HPP

#include <eosiolib/eosio.hpp>
#include "common/messageid.h"
#include "mypherbase.hpp"

namespace mypher {

using namespace std;
using namespace eosio;

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
		account_name id;
		string name;
		std::vector<std::string> tags;
		std::string info;

		auto primary_key() const { return id; }

		EOSLIB_SERIALIZE( person, (id)(name)(tags)(info) )
	};
	/**
	 * @brief the definition of the table for "person"
	 */
	typedef eosio::multi_index<N(person), person> data;

	/**
	 * @brief create new person
	 */
	[[eosio::action]]
	void pupdate(const account_name id, const std::string& name, const std::vector<std::string>& tags, const std::string& info);

};

} // mypher

#endif // PERSON_HPP