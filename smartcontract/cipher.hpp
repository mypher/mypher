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
		std::vector<account_name> editors;
		std::string hash;
		uint16_t drule_req;
		std::vector<account_name> drule_auth;
		std::vector<account_name> approved;

		uint64_t primary_key() const { return id; }
		uint64_t secondary_key() const { 
			return gen_secondary_key(cipherid, version, draftno);	
		}
		
		EOSLIB_SERIALIZE(cipher, 
			(id)(cipherid)(version)(draftno)(formal)(editors)(hash)
			(drule_req)(drule_auth)(approved))
	};
	/**
	 * @brief keydata of cipher
	 */
	struct [[eosio::table]] ckey {
		uint64_t id;
		std::string name;
		std::vector<std::string> tags;

		uint64_t primary_key() const { return id; }
		
		EOSLIB_SERIALIZE(ckey, (id)(name)(tags))
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
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, const std::string& hash,
				uint16_t drule_req, const std::vector<account_name>& drule_auth);
	[[eosio::action]]
	void cdraft(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, const std::string& hash,
				uint16_t drule_req, const std::vector<account_name>& drule_auth);
	[[eosio::action]]
	void cupdate(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, const std::string& hash,
				uint16_t drule_req, const std::vector<account_name>& drule_auth);
	[[eosio::action]]
	void capprove(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno);
	[[eosio::action]]
	void crevapprove(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno);

private:
	account_name self;

	static uint64_t gen_secondary_key(const uint32_t& cipherid, 
									 const uint16_t& ver, const uint16_t& draftno);
	static std::string gen_third_key(const bool& formal, const std::string& name);

	bool canEdit(const account_name& sender, const std::vector<account_name>& editors);
	uint32_t getNewCipherId(const data& d);
	uint16_t getNewVersion(const data& d,const uint32_t cipherid);
	uint16_t getNewDraftNo(const data& d, const uint32_t cipherid, const uint16_t ver);
	bool isVersionFormal(const data& d, const uint32_t cipherid, const uint16_t ver);
};

} // mypher
#endif // CIPHER_HPP