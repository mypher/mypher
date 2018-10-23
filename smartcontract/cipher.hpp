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

public:
	Cipher(account_name _self);

	/**
	 * @brief information of cipher
	 */
	struct [[eosio::table]] cipher {
		uint64_t id;
		uint32_t cipherid;
		uint16_t version;
		uint16_t draftno;
		bool formal;
		std::string name;
		std::vector<account_name> editors;
		std::vector<std::string> tags;
		std::string hash;

		auto primary_key() const { return id; }
		uint64_t secondary_key() const { 
			return gen_secondary_id(cipherid, version, draftno);	
		}
		
		EOSLIB_SERIALIZE( cipher, 
			(id)(cipherid)(version)(draftno)(formal)(name)(editors)(tags)(hash))
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
	 * @brief create new cipher
	 */
	[[eosio::action]]
	void cnew(const account_name sender, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, std::string& hash, bool formal);
	[[eosio::action]]
	void cdraft(const account_name sender, uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, std::string& hash, bool formal);
	[[eosio::action]]
	void cupdate(const account_name sender, uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, std::string& hash, bool formal);

private:
	account_name self;

	static uint64_t gen_secondary_id(const uint32_t& cipherid, 
									 const uint16_t& ver, const uint16_t& draftno);

	bool canEdit(const account_name& sender, const std::vector<account_name>& editors);
	uint32_t getNewCipherId(const data& d);
	uint16_t getNewVersion(const data& d,const uint32_t cipherid);
	uint16_t getNewDraftNo(const data& d, const uint32_t cipherid, const uint16_t ver);
	bool isVersionFormaled(const data& d, const uint32_t cipherid, const uint16_t ver);
};

} // mypher
#endif // CIPHER_HPP