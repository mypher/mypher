// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef CIPHER_HPP
#define CIPHER_HPP

#include <eosiolib/eosio.hpp>
#include "mypherbase.hpp"

namespace mypher {

using namespace std;
using namespace eosio;

/**
 * @defgroup mypher
 * @class cipher
 * @brief the contract for managing a group named "cipher"
 */
class Cipher : virtual public MypherBase {
private:
	const static int NAME_MINLEN = 6;

public:
	/**
	 * @brief information of formal version of cipher
	 */
	struct [[eosio::table]] cformal {
	 	uint64_t		cipherid;
		uint64_t		cdraftid;
		name			multisig;
		string			name;
		vector<string>	tags;

		uint64_t primary_key() const { return cipherid; }
		
		EOSLIB_SERIALIZE(cformal, (cipherid)(cdraftid)(multisig)(name)(tags))
	};

	/**
	 * @brief information of draft of cipher
	 */
	struct [[eosio::table]] cdraft {
		uint64_t				cdraftid;
	    uint16_t				version;
	    uint16_t				no;
		bool					formal;
		string					name;
		vector<string>			tags;
		vector<account_name>	editors;
		string					hash;
		uint16_t				nofapproval;
		vector<account_name>	approvers;
		vector<account_name>	approved;
		vector<uint64_t>		tasklist;
		vector<uint64_t>		tokenlist;

		uint64_t primary_key() const { return cdraftid; }
		uint64_t secondary_key() const {
			return gen_secondary_key(version, no);	
		}
		
		EOSLIB_SERIALIZE(cdraft, (cdraftid)(version)(no)(formal)(name)
			(tags)(editors)(hash)(nofapproval)(approvers)(approved)(tasklist)(tokenlist))
	};

	/**
	 * @brief the definition of the table for "cformal"
	 */
	typedef eosio::multi_index< 
			N(cformal), 
			cformal
	> cformal_data;

	/**
	 * @brief the definition of the table for key of "cdraft"
	 */
	typedef eosio::multi_index< 
			N(cdraft), 
			cdraft,
			indexed_by<N(secondary_key), const_mem_fun<cdraft, uint64_t, &cdraft::secondary_key>>
	> cdraft_data;

	/**
	 * @brief create new cipher
	 */
	[[eosio::action]]
	void cnew(const account_name sender, 
				const string& name, const vector<account_name>& editors,
				const account_name multisig,
				const vector<string>& tags, const string& hash,
				uint16_t nofapproval, const vector<account_name>& approvers);
	/**
	 * @brief create new draft from specified version 
	 */
	[[eosio::action]]
	void cnewdraft(const account_name sender, const uint64_t cipherid, const uint64_t cdraftid);

	/**
	 * @brief update draft data 
	 */
	[[eosio::action]]
	void cupdate(const account_name sender, const uint64_t cipherid, 
				const uint64_t cdraftid, const uint16_t version, const uint16_t no, 
				const string& name, const vector<string>& tags, 
				const vector<account_name>& editors, const string& hash,
				const uint16_t nofapproval, const vector<account_name>& approvers,
				const vector<uint64_t>& tasklist, const vector<uint64_t>& tokenlist);

	/**
	 * @brief approve a draft 
	 */
	[[eosio::action]]
	void capprove(const account_name sender, const uint64_t cipherid, const uint64_t cdraftid);

	/**
	 * @brief reverse approval for a draft 
	 */
	[[eosio::action]]
	void crevapprove(const account_name sender, const uint64_t cipherid, const uint64_t cdraftid);

private:
	bool can_edit(const account_name& sender, const vector<account_name>& editors);
	/**
	 * @brief generate version and no for new draft 
	 */
	void gen_draftno(const uint64_t cipherid, uint16_t& version, uint16_t& no);

	void check_data(const account_name sender, 
				const string& name, const vector<account_name>& editors,
				const vector<string>& tags, const string& hash,
				const uint16_t nofapproval, const vector<account_name>& approvers);
	void validate_tasklist(const uint64_t cipherid, const vector<uint64_t>& tasklist);
	void validate_tokenlist(const vector<uint64_t>& tokenlist);

// common
public:
	static bool is_draft_version(const uint64_t cipherid, const uint16_t version);
	static bool exists(const uint64_t cipherid); 
	static bool is_draft_exists(const uint64_t cipherid, const uint64_t cdraftid);
	static uint64_t gen_secondary_key(const uint16_t& version, const uint16_t& no);
};

} // mypher
#endif // CIPHER_HPP