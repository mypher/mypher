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
private:
	const static int NAME_MINLEN = 6;

public:
	/**
	 * @brief information of task
	 */
	struct [[eosio::table]] task {
		uint64_t taskid;
		uint64_t owner;
		string name;
		uint64_t rewardid;
		uint64_t quantity;
		uint8_t nofapproval;
		vector<account_name> approvers;
		vector<account_name> approve_content;
		vector<account_name> approve_pic;
		vector<account_name> approve_results;
		vector<account_name> pic;
		string hash;
		bool formal;
		vector<string> tags;

		uint64_t primary_key() const { return id; }
		uint64_t secondary_key() const { return (uint64_t)owner; }

		EOSLIB_SERIALIZE( task, (id)(cipherid)(owner)(name)
							(rewardid)(rquantity)
							(nofauth)(approvers)(approve_task)(approve_pic)(approve_results)
							(pic)(hash)(formal)(tags))
	};
	/**
	 * @brief the definition of the table for "task"
	 */
	typedef eosio::multi_index<
			N(task), 
			task,
			indexed_by<N(secondary_key), const_mem_fun<task, uint64_t, &task::secondary_key>>
	> data;

	/**
	 * @brief create new task
	 */
	[[eosio::action]]
	void tanew(	const account_name sender, const uint64_t cid, 
				const string& name, const uint64_t rewardid, const uint64_t rquantity, 
				const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, 
				const string& hash,
				const vector<string>& tags);

	/**
	 * @brief update task data
	 */
	[[eosio::action]]
	void taupdate( const account_name sender, 
				const uint64_t cid, const uint64_t id, 
				const string& name,  
				const uint64_t rewardid, const uint64_t rquantity, 
				const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, const string& hash, 
				const vector<string>& tags);
	
	/**
	 * @brief approve a task 
	 */
	[[eosio::action]]
	void taaprvtask( const account_name sender, const uint64_t id, const bool vec);

	/**
	 * @brief approve a pic 
	 */
	[[eosio::action]]
	void taaprvpic( const account_name sender, const uint64_t id, const bool vec);

	/**
	 * @brief approve results
	 */
	[[eosio::action]]
	void taaprvrslt( const account_name sender, const uint64_t id, const bool vec);

	/**
	 * @brief apply for pic of a task
	 */
	[[eosio::action]]
	void applyforpic( const account_name sender, const uint64_t id, const bool vec);

	static bool is_completed(const uint64_t taskid);

private:
	bool is_pic_approved(const task& d);
	bool is_task_approved(const task& d);
	bool is_results_approved(const task& d);
	bool is_results_approved_some(const task& d);
	void checkdata( 
				const account_name sender,
				const account_name owner, const uint64_t cid,
				const string& name, const uint64_t rewardid, 
				const uint64_t rquantity, const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, const string& hash, 
				const vector<string>& tags);
	bool is_shared(const uint64_t taskid, const uint64_t cid);
};

} // mypher

#endif // TASK_HPP