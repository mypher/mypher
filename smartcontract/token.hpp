// Copyright (C) 2018-2019 The Mypher Authors
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
		// use for validatig a value
		DISPOSAL_MAX
	};

	enum ISSUE_STATUS {
		OWN,
		REQPAY,
		SELL,
		// use for validatig a value
		ISSUE_STATUS_MAX	
	};

	/**
	 * @brief information of token 
	 */
	struct [[eosio::table]] token {
		uint64_t 				tokenid;
		string 					tkname;
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
		uint64_t 				nofdesteos;
		vector<eosio::name> 	approval_4ex;

		uint64_t primary_key() const { return tokenid; }
		uint64_t secondary_key() const { return (uint64_t)issuer; }

		EOSLIB_SERIALIZE( token, 
			(tokenid)(tkname)(issuer)(limit)(when)(disposal)(type)(taskid)(extokenid)
			(reftoken)(rcalctype)(nofdesttoken)(nofdesteos)(approval_4ex) )
	};

	/**
	 * @brief information of issuing information of token 
	 */
	struct [[eosio::table]] issued {
		uint64_t		issueid;
		eosio::name		owner;
		uint64_t		quantity;
		uint8_t			status;
		name			payinf;
		
		uint64_t primary_key() const { return issueid; }
		uint64_t secondary_key() const { return (uint64_t)owner; }

		EOSLIB_SERIALIZE( issued, (issueid)(owner)(quantity)(status)(payinf) )
	};

	/**
	 * @brief the definition of the table for "token"
	 */
	typedef eosio::multi_index<
			"token"_n, 
			token,
			indexed_by<"key2"_n, const_mem_fun<token, uint64_t, &token::secondary_key>>
	> token_data;

	/**
	 * @brief the definition of the table for "issue"
	 */
	typedef eosio::multi_index<
			"issued"_n,
			issued,
			indexed_by<N(secondary_key), const_mem_fun<issued, uint64_t, &issued::secondary_key>>
	> issued_data;

	/**
	 * @brief create new token
	 */
	[[eosio::action]]
	void tknew(const eosio::name sender, const uint64_t cdraftid, 
			const string& tkname, const uint64_t issuer,
			const uint64_t limit, const uint8_t when, 
			const uint8_t disposal, const uint8_t type, const uint64_t taskid, 
			const uint64_t extokenid, const uint64_t reftoken, 
			const uint8_t rcalctype, const uint64_t nofdesttoken, const uint64_t nofdesteos);

	/**
	 * @brief update token data
	 */
	[[eosio::action]]
	void tkupdate(const eosio::name sender, const uint64_t cdraftid,
			const uint64_t tokenid,
			const string& tkname, const uint64_t limit, const uint8_t when, 
			const uint8_t disposal, const uint8_t type, const uint64_t taskid, 
			const uint64_t extokenid, const uint32_t reftoken,  
			const uint8_t rcalctype, const uint32_t nofdesttoken, uint64_t nofdesteos);

	/**
	 * @brief transfer a token 
	 */
	[[eosio::action]]
	void tktransfer(const eosio::name sender, 
				const uint64_t tokenid, const eosio::name recipient, const uint64_t quantity); 

	/**
	 * @brief use some tokens 
	 */
	[[eosio::action]]
	void tkuse(const eosio::name sender, const uint64_t tokenid, const uint64_t quantity);

	/**
	 * @brief request payments
	 */
	[[eosio::action]]
	void tkreqpay(const eosio::name& sender, const uint64_t& tokenid, const uint64_t& quantity, 
					const name& proposal_name, const vector<eosio::name>& approvals);

	/**
	 * @brief get paid
	 */
	[[eosio::action]]
	void tkgetpay(const eosio::name& sender, const uint64_t& tokenid, const name& proposal_name);

	/*******************************************************************
	  methods only called from inside of the myphersystem contract
	 *******************************************************************/

	/**
	 * @brief issue a token 
	 */
	static void issue(const eosio::name sender, const uint64_t cipherid,
			   const uint64_t tokenid, const eosio::name recipient, const uint64_t quantity);

private:
	void check_data(
			   const eosio::name sender, 
			   const string& tkname, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken,  
			   const uint8_t rcalctype, const uint64_t nofdevtoken,
			   const uint64_t nofdesteos );

	bool is_shared(const uint64_t tokenid, const uint64_t cipherid, const uint64_t cdraftid);
	void distribute(const eosio::name sender, const uint64_t cipherid, 
					const uint64_t tokenid, const uint64_t quantity);
	void can_use(const token& tok, const issued& isu, const uint64_t quantity);
	//void transfer_currency(const eosio::name send, const eosio::name issuer, const uint32_t issuer2, const uint32_t quantity);

	static uint64_t get_available_amount(const uint64_t tokenid);
	static bool is_issued(const uint64_t tokeniid);
	static void set_amount(const eosio::name sender, const uint64_t tokenid, const eosio::name user, const uint64_t quantity);
	static bool is_sufficient_owned_token(const uint64_t issuer, const uint64_t tokenid, const uint64_t amount);
	static bool exists(const uint64_t tokenid);
};

} // mypher

#endif // TOKEN_HPP
