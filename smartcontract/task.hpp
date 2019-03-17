// Copyright (C) 2018-2019 The Mypher Authors
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
 * @class Task
 * @brief the contract for dealing with task
 */
class Task : virtual public MypherBase {
private:
	const static int NAME_MINLEN = 6;

public:
	/**
	 * @brief information for the formal version of task 
	 */
	struct [[eosio::table]] tformal {
		uint64_t tformalid;
		uint64_t cipherid; 
		uint64_t tdraftid; 
		string taname;
		vector<eosio::name> approve_pic;
		vector<eosio::name> approve_results;
		vector<string> tags;
		string results;
		eosio::name payment;
		bool completed;

		uint64_t primary_key() const { return tformalid; }
		uint64_t secondary_key() const { return cipherid; }

		EOSLIB_SERIALIZE( tformal, (tformalid)(cipherid)(tdraftid)(taname)(approve_pic)
						(approve_results)(tags)(results)(payment)(completed) )
	};

	/**
	 * @brief information for the draft version of task 
	 */
	struct [[eosio::table]] tdraft {
		uint64_t tdraftid;
		string taname;
		uint64_t rewardid;
		uint64_t noftoken;
		uint64_t amount;
		uint64_t nofapproval;
		vector<eosio::name> approvers;
		vector<eosio::name> pic;
		string hash;
		vector<string> tags;

		uint64_t primary_key() const { return tdraftid; }
		EOSLIB_SERIALIZE( tdraft,(tdraftid)(taname)(rewardid)(noftoken)(amount)
						(nofapproval)(approvers)(pic)(hash)(tags) )
	};

	/**
	 * @brief the definition of the table for "tformal"
	 */
	typedef eosio::multi_index<
			N(tformal), 
			tformal,
			indexed_by<N(secondary_key), const_mem_fun<tformal, uint64_t, &tformal::secondary_key>>
	> tformal_data;

	/**
	 * @brief the definition of the table for "tdraft"
	 */
	typedef eosio::multi_index<
			N(tdraft), 
			tdraft
	> tdraft_data;

	/**
	 * @brief create new task
	 */
	[[eosio::action]]
	void tanew(	const eosio::name sender, const uint64_t cipherid, uint64_t cdraftid,
				const string& taname, const uint64_t rewardid, const uint64_t noftoken, 
				const uint64_t amount, const uint8_t nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, 
				const string& hash,
				const vector<string>& tags);

	/**
	 * @brief update task data
	 */
	[[eosio::action]]
	void taupdate( const eosio::name sender, const uint64_t cipherid, const uint64_t cdraftid,
				const uint64_t tdraftid, 
				const string& taname,  
				const uint64_t rewardid, const uint64_t noftoken, 
				const uint64_t amount, const uint8_t nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, const string& hash, 
				const vector<string>& tags);
	
	/**
	 * @brief approve a pic 
	 */
	[[eosio::action]]
	void taaprvpic( const eosio::name sender, const uint64_t tformalid, const bool vec);

	/**
	 * @brief approve results
	 */
	[[eosio::action]]
	void taaprvrslt( const eosio::name sender, const uint64_t tformalid, const bool vec);

	/**
	 * @brief apply for pic of a task
	 */
	[[eosio::action]]
	void taaplypic( const eosio::name sender, const uint64_t tformalid, const bool vec);

	/**
	 * @brief present the results
	 */
	[[eosio::action]]
	void taprrslt( const eosio::name sender, const uint64_t tformalid, const string& results);

	/**
	 * @brief request the payments
	 */
	[[eosio::action]]
	void tareqpay( const eosio::name sender, const uint64_t tformalid, 
		const name& proposal_name, const vector<eosio::name>& approvals);

	/**
	 * @brief finish the task
	 */
	[[eosio::action]]
	void tafinish( const eosio::name& sender, const uint64_t& tformalid, const name& proposal_name);

	static bool exists(const uint64_t cipherid, const uint64_t tdraftid);

	static bool exists(const uint64_t tformalid);
	static bool is_results_approved(const uint64_t tformalid);
	static void formalize(const eosio::name sender, const uint64_t cipherid, const vector<uint64_t>& tasklist);
	static bool pic_approved(const uint64_t tformalid);

private:
	void check_data( 
				const eosio::name sender, const uint64_t cipherid,
				const string& taname, const uint64_t rewardid, 
				const uint64_t noftoken, const uint64_t amount, const uint8_t nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, const string& hash, 
				const vector<string>& tags);
	bool is_shared(const uint64_t tdraftid, const uint64_t cipherid, const uint64_t cdraftid);
};

} // mypher

#endif // TASK_HPP
