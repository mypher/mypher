// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef TOKEN_HPP
#define TOKEN_HPP

#include <eosiolib/eosio.hpp>
#include "common/messageid.h"
#include "mypherbase.hpp"

namespace mypher {

using namespace std;
using namespace eosio;

/**
 * @defgroup mypher
 * @class Token
 * @brief managing each tokens attributes
 */
class Token : virtual public MypherBase {
public:
	/**
	 * @brief information of token 
	 */
	struct [[eosio::table]] token {
		uint64_t id;
		string name;
		account_name issuer;
		uint32_t issuer2;
		uint32_t limit;
		uint8_t when;
		uint8_t disposal;
		uint8_t type;
		uint64_t taskid;
		uint64_t tokenid;
		uint32_t reftoken;
		string term;
		uint8_t rcalctype;
		uint32_t nofdevtoken;

		uint64_t primary_key() const { return id; }
		uint64_t secondary_key() const { return (uint64_t)issuer2; }

		EOSLIB_SERIALIZE( token, 
			(id)(name)(issuer)(issuer2)(limit)(when)(disposal)(type)(taskid)(tokenid)
			(reftoken)(term)(rcalctype)(nofdevtoken) )
	};

	/**
	 * @brief information of issuing information of token 
	 */
	struct [[eosio::table]] issue {
		account_name owner;
		uint32_t	 quantity;
		
		account_name primary_key() const { return owner; }

		EOSLIB_SERIALIZE( issue, (owner)(quantity) )
	};

	/**
	 * @brief the definition of the table for "token"
	 */
	typedef eosio::multi_index<
			N(token), 
			token,
			indexed_by<N(secondary_key), const_mem_fun<token, uint64_t, &token::secondary_key>>
	> data;

	/**
	 * @brief the definition of the table for "issue"
	 */
	typedef eosio::multi_index<
			N(issue),
			issue
	> data2;

	/**
	 * @brief create new token
	 */
	[[eosio::action]]
	void tknew(const account_name sender, const uint64_t cid,
			   const string& name, const account_name issuer, 
			   const uint32_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken );

	/**
	 * @brief update token data
	 */
	[[eosio::action]]
	void tkupdate(const account_name sender, 
			   const uint64_t cid, const uint64_t id,
			   const string& name, const account_name issuer, 
			   const uint32_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken );

	/**
	 * @brief transfer a token 
	 */
	[[eosio::action]]
	void tktransfer(const account_name sender, 
				const uint64_t tokenid, const account_name receiver, const uint32_t quantity); 

	/**
	 * @brief use a token 
	 */
	[[eosio::action]]
	void tkuse(const account_name sender, const uint64_t tokenid, const uint32_t quantity);

	/*******************************************************************
	  methods only called from inside of the myphersystem contract
	 *******************************************************************/

	/**
	 * @brief issue a token 
	 */
	static void issue(const account_name sender, const uint32_t cipherid,
			   const uint64_t tokenid, const account_name receiver, const uint32_t quantity);

private:
	void checkdata(
			   const account_name sender, const uint64_t cid,
			   const string& name, const account_name issuer, 
			   const uint32_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t tokenid, const uint32_t reftoken, const string& term, 
			   const uint8_t rcalctype, const uint32_t nofdevtoken,
			   const vector<account_name>& editors );

	bool is_shared(const uint64_t id, const uint64_t cid);

	static uint32_t getAvailableAmount(const uint64_t id);
	static bool is_issued(const uint64_t id);
	static void set_amount(const account_name sender, const uint64_t tokenid, const account_name user, const uint32_t quantity);
};

} // mypher

#endif // TOKEN_HPP