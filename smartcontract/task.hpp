// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef TASK_HPP
#define TASK_HPP

#include <eosiolib/eosio.hpp>
#include "common/messageid.h"
#include "mypherbase.hpp"

using namespace std;
using namespace eosio;

namespace mypher {

/**
 * @defgroup mypher
 * @class cipher
 * @brief the contract for dealing with task
 */
class Task : virtual public MypherBase {

public:
	/**
	 * @brief information of task
	 */
	struct [[eosio::table]] task {
		uint64_t id;
		uint64_t cipherid;
		account_name owner;
		string name;
		string description;
		uint64_t ruleid;
		uint64_t rewardid;
		uint64_t rquantity;
		vector<account_name> pic;
		bool formal;
		vector<string> tags;

		auto primary_key() const { return id; }

		EOSLIB_SERIALIZE( task, (id)(cipherid)(owner)(name)(description)
									(ruleid)(rewardid)(rquantity)(pic)(formal)(tags))
	};
	/**
	 * @brief the definition of the table for "task"
	 */
	typedef eosio::multi_index<
			N(task), 
			task
	> data;

	/**
	 * @brief create new task
	 */
	[[eosio::action]]
	void tanew(	const account_name sender, const uint64_t cipherid, const account_name owner,
				const string& name, const string& description, const uint64_t ruleid, 
				const uint64_t rewardid, const uint64_t rquantity, const vector<account_name>& pic, 
				const bool formal, const vector<string>& tags);

	/**
	 * @brief update task data
	 */
	[[eosio::action]]
	void taupdate( const account_name sender, const uint64_t id, const uint64_t cipherid, 
				const account_name owner, const string& name, const string& description, 
				const uint64_t ruleid, const uint64_t rewardid, const uint64_t rquantity, 
				const vector<account_name>& pic, const bool formal, const vector<string>& tags);
};

} // mypher

#endif // TASK_HPP