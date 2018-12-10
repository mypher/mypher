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

/**
 * @defgroup mypher
 * @class cipher
 * @brief the contract for managing a group named "cipher"
 */
class Cipher : virtual public MypherBase {

public:
	// TODO: dealing with scope with cipherid

	/**
	 * @brief information of cipher
	 */
	struct [[eosio::table]] cipher {
		uint64_t id;
		uint32_t cipherid;
		uint16_t version;
		uint16_t draftno;
		bool formal;
		vector<account_name> editors;
		string hash;
		uint16_t drule_req;
		vector<account_name> drule_auth;
		vector<account_name> approved;
		vector<uint64_t> tasklist;
		vector<uint64_t> tokenlist;

		uint64_t primary_key() const { return id; }
		uint64_t secondary_key() const {
			return gen_secondary_key(cipherid, version, draftno);	
		}
		
		EOSLIB_SERIALIZE(cipher, 
			(id)(cipherid)(version)(draftno)(formal)(editors)(hash)
			(drule_req)(drule_auth)(approved)(tasklist)(tokenlist))
	};
	/**
	 * @brief keydata of cipher
	 */
	struct [[eosio::table]] ckey {
		uint64_t id;
		string name;
		vector<string> tags;
		bool formal;

		uint64_t primary_key() const { return id; }
		
		EOSLIB_SERIALIZE(ckey, (id)(name)(tags)(formal))
	};

	/**
	 * @brief the definition of the table for "cipher"
	 */
	typedef eosio::multi_index< 
			N(cipher), 
			cipher,
			indexed_by<N(secondary_key), const_mem_fun<cipher, uint64_t, &cipher::secondary_key>>
	> data;

	/**
	 * @brief the definition of the table for key of "cipher"
	 */
	typedef eosio::multi_index< 
			N(ckey), 
			ckey
	> keydata;

	/**
	 * @brief create new cipher
	 */
	[[eosio::action]]
	void cnew(const account_name sender, 
				const string& name, const vector<account_name>& editors,
				const vector<string>& tags, const string& hash,
				uint16_t drule_req, const vector<account_name>& drule_auth);
	[[eosio::action]]
	void ccopy(const account_name sender, uint64_t id);
	/*[[eosio::action]]
	void cdraft(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const string& name, const vector<account_name>& editors,
				const vector<string>& tags, const string& hash,
				uint16_t drule_req, const vector<account_name>& drule_auth);*/
	[[eosio::action]]
	void cupdate(const account_name sender,
				uint64_t id,
				uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const string& name, const vector<account_name>& editors,
				const vector<string>& tags, const string& hash,
				uint16_t drule_req, const vector<account_name>& drule_auth,
				const vector<uint64_t>& tasklist, const vector<uint64_t>& tokenlist);
	[[eosio::action]]
	void capprove(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno);
	[[eosio::action]]
	void crevapprove(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno);

private:
	static string gen_third_key(const bool& formal, const string& name);

	bool canEdit(const account_name& sender, const vector<account_name>& editors);
	uint32_t getNewCipherId(const data& d);
	uint16_t getNewVersion(const data& d,const uint32_t cipherid);
	uint16_t getNewDraftNo(const data& d, const uint32_t cipherid, const uint16_t ver);
	bool isVersionFormal(const data& d, const uint32_t cipherid, const uint16_t ver);
	void check_data(const account_name sender, 
				const string& name, const vector<account_name>& editors,
				const vector<string>& tags, const string& hash,
				uint16_t drule_req, const vector<account_name>& drule_auth);
	void checkTaskList(const vector<uint64_t>& list);
	void checkTokenList(const vector<uint64_t>& list);

// common
public:
	static bool isCipherExists(const uint64_t id); 
	static uint64_t gen_secondary_key(const uint32_t& cipherid, 
									 const uint16_t& ver, const uint16_t& draftno);
};

} // mypher
#endif // CIPHER_HPP