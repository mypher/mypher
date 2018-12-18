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
	enum Type {
		NONE,
		PUBLISH_QRCODE,
		DISTRIBUTE_TOKEN,
		DISTRIBUTE_CRYPTOCURRENCY,
		// use for validating a value
		TYPE_MAX
	};

	enum When {
		UNALLOW,
		COMPLETE_TASK,
		OVER_ISSUER_OWNED_TOKEN,
		ALWAYS,
		FLAG,
		// use for validating a value
		WHEN_MAX	
	};

	enum Disposal {
		NO,
		YES,
		// user for validatig a value
		DISPOSAL_MAX
	};

	/**
	 * @brief information of token 
	 */
	struct [[eosio::table]] token {
		uint64_t 				tokenid;
		string 					name;
		uint64_t 				issuer;
		uint64_t 				limit;
		uint8_t 				when;
		uint8_t 				disposal;
		uint8_t					type;
		uint64_t 				taskid;
		uint64_t 				extokenid;
		uint64_t		 		reftoken;
		uint8_t 				rcalctype;
		uint64_t 				nofdesttoken;
		double_t 				nofdesteos;
		vector<account_name> 	approval_4ex;

		uint64_t primary_key() const { return tokenid; }
		uint64_t secondary_key() const { return (uint64_t)issuer; }

		EOSLIB_SERIALIZE( token, 
			(tokenid)(name)(issuer)(limit)(when)(disposal)(type)(taskid)(extokenid)
			(reftoken)(rcalctype)(nofdesttoken)(nofdesteos)(approval_4ex) )
	};

	/**
	 * @brief information of issuing information of token 
	 */
	struct [[eosio::table]] issue {
		account_name owner;
		uint64_t	 quantity;
		
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
	> token_data;

	/**
	 * @brief the definition of the table for "issue"
	 */
	typedef eosio::multi_index<
			N(issue),
			issue
	> issue_data;

	/**
	 * @brief create new token
	 */
	[[eosio::action]]
	void tknew(const account_name sender, const uint64_t cdraftid, 
			   const string& name, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken, 
			   const uint8_t rcalctype, const uint64_t nofdesttoken, const double_t nofdesteos );

	/**
	 * @brief update token data
	 */
	[[eosio::action]]
	void tkupdate(const account_name sender, const uint64_t cdraftid,
			   const uint64_t tokenid,
			   const string& name, const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint32_t reftoken,  
			   const uint8_t rcalctype, const uint32_t nofdesttoken, double_t nofdesteos );

	/**
	 * @brief transfer a token 
	 */
	[[eosio::action]]
	void tktransfer(const account_name sender, 
				const uint64_t tokenid, const account_name recipient, const uint64_t quantity); 

	/**
	 * @brief use a token 
	 */
	[[eosio::action]]
	void tkuse(const account_name sender, const uint64_t tokenid, const uint64_t quantity);

	[[eosio::action]]
	void approve2ex(const account_name sender, const uint64_t tokenid);

	/*******************************************************************
	  methods only called from inside of the myphersystem contract
	 *******************************************************************/

	/**
	 * @brief issue a token 
	 */
	static void issue(const account_name sender, const uint64_t cipherid,
			   const uint64_t tokenid, const account_name recipient, const uint64_t quantity);

private:
	void check_data(
			   const account_name sender, 
			   const string& name, 
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken,  
			   const uint8_t rcalctype, const uint64_t nofdevtoken,
			   const double_t nofdesteos );

	bool is_shared(const uint64_t tokenid, const uint64_t cipherid);
	void distribute(const account_name sender, const uint64_t cipherid, 
					const uint64_t tokenid, const uint64_t quantity);
	//void transfer_currency(const account_name send, const account_name issuer, const uint32_t issuer2, const uint32_t quantity);

	static uint64_t get_available_amount(const uint64_t tokenid);
	static bool is_issued(const uint64_t tokeniid);
	static void set_amount(const account_name sender, const uint64_t tokenid, const account_name user, const uint64_t quantity);
	static bool is_sufficient_owned_token(const uint64_t issuer, const uint64_t tokenid, const uint64_t amount);
	static bool exists(const uint64_t tokenid);
};

} // mypher

#endif // TOKEN_HPP