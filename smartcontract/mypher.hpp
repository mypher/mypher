// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef MYPHER_HPP
#define MYPHER_HPP

#include <eosiolib/eosio.hpp>
#include "common/messageid.h"
#include "common/prim.hpp"

using namespace eosio;
using namespace std;

#define NUMBER_NULL 0xffffffff
#define KEY2 "key2"_n
#define ACTIVE "active"_n

CONTRACT Mypher : public contract {

public: 
	using contract::contract;

	Mypher(name receiver, name code, datastream<const char*> ds) 
	: contract(receiver, code, ds) 
	, person_data(receiver, receiver.value)
	, cformal_data(receiver, receiver.value)
	, tformal_data(receiver, receiver.value)
	, token_data(receiver, receiver.value)
	{}

	// PERSON
	ACTION pupdate(const eosio::name& personid, const string pname, const vector<string> tags, const string hash);
	// CIPHER
	ACTION cnew(const eosio::name& sender, 
				const string& cname, const vector<eosio::name>& editors,
				const eosio::name& multisig,
				const vector<string>& tags, const string& hash,
				const uint16_t& nofapproval, const vector<eosio::name>& approvers);
	ACTION cnewdraft(const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid);
	ACTION cupdate(const eosio::name& sender, const uint64_t& cipherid, 
				const uint64_t& cdraftid, const uint16_t& version, const uint16_t& no, 
				const string& cname, const vector<string>& tags, 
				const vector<eosio::name>& editors, const string& hash,
				const uint16_t& nofapproval, const vector<eosio::name>& approvers,
				const vector<uint64_t>& tasklist, const vector<uint64_t>& tokenlist);
	ACTION capprove(const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid);
	ACTION crevapprove(const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid);

	// TASK
	ACTION tanew( const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid,
				const string& taname, const uint64_t& rewardid, const uint64_t& noftoken, 
				const uint64_t& amount, const uint8_t& nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, 
				const string& hash,
				const vector<string>& tags);
	ACTION taupdate( const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid,
				const uint64_t& tdraftid, 
				const string& taname,  
				const uint64_t& rewardid, const uint64_t& noftoken, 
				const uint64_t& amount, const uint8_t& nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, const string& hash, 
				const vector<string>& tags);
	ACTION taaprvpic( const eosio::name& sender, const uint64_t& tformalid, const bool& vec);
	ACTION taaprvrslt( const eosio::name& sender, const uint64_t& tformalid, const bool& vec);
	ACTION taaplypic( const eosio::name sender, const uint64_t tformalid, const bool vec);
	ACTION taprrslt( const eosio::name sender, const uint64_t tformalid, const string& results);
	ACTION tareqpay( const eosio::name sender, const uint64_t tformalid, 
		const name& proposal_name, const vector<eosio::name>& approvals);
	ACTION tafinish( const eosio::name& sender, const uint64_t& tformalid, const name& proposal_name);

	//TOKEN
	ACTION tknew(const eosio::name sender, const uint64_t cdraftid, 
			const string& tkname, const uint64_t issuer,
			const uint64_t limit, const uint8_t when, 
			const uint8_t disposal, const uint8_t type, const uint64_t taskid, 
			const uint64_t extokenid, const uint64_t reftoken, 
			const uint8_t rcalctype, const uint64_t nofdesttoken, const uint64_t nofdesteos);
	ACTION tkupdate(const eosio::name sender, const uint64_t cdraftid,
			const uint64_t tokenid,
			const string& tkname, const uint64_t limit, const uint8_t when, 
			const uint8_t disposal, const uint8_t type, const uint64_t taskid, 
			const uint64_t extokenid, const uint32_t reftoken,  
			const uint8_t rcalctype, const uint32_t nofdesttoken, uint64_t nofdesteos);
	ACTION tktransfer(const eosio::name sender, 
				const uint64_t tokenid, const eosio::name recipient, const uint64_t quantity); 
	ACTION tkuse(const eosio::name sender, const uint64_t tokenid, const uint64_t quantity);
	ACTION tkreqpay(const eosio::name& sender, const uint64_t& tokenid, const uint64_t& quantity, 
					const name& proposal_name, const vector<eosio::name>& approvals);
	ACTION tkgetpay(const eosio::name& sender, const uint64_t& tokenid, const name& proposal_name);

private:

/***************************************************************
 * Person
 ***************************************************************/
	const static size_t MINLEN_NAME = 1;
	const static size_t MAXLEN_NAME = 32;

	/**
	 * @brief information of person
	 */
	TABLE person {
		eosio::name personid;
		string pname;
		vector<string> tags;
		string hash;
		vector<uint64_t> tokenlist;

		uint64_t primary_key() const { return personid.value; }

		EOSLIB_SERIALIZE( person, (personid)(pname)(tags)(hash)(tokenlist) )
	};
	eosio::multi_index<"person"_n, person> person_data;

	bool check_person_list(const vector<eosio::name>& list);
	bool is_person_exists(const eosio::name user);

/***************************************************************
 * Cipher
 ***************************************************************/
	const static int CIPHERNAME_MINLEN = 6;

	/**
	 * @brief information of formal version of cipher
	 */
	TABLE cformal {
	 	uint64_t		cipherid;
		uint64_t		cdraftid;
		eosio::name		multisig;
		string			cname;
		vector<string>	tags;

		uint64_t primary_key() const { return cipherid; }
		
		EOSLIB_SERIALIZE(cformal, (cipherid)(cdraftid)(multisig)(cname)(tags))
	};
	eosio::multi_index<"cformal"_n, cformal> cformal_data;

	/**
	 * @brief information of draft of cipher
	 */
	TABLE cdraft {
		uint64_t				cdraftid;
	    uint16_t				version;
	    uint16_t				no;
		bool					formal;
		string					cname;
		vector<string>			tags;
		vector<eosio::name>	editors;
		string					hash;
		uint16_t				nofapproval;
		vector<eosio::name>	approvers;
		vector<eosio::name>	approved;
		vector<uint64_t>		tasklist;
		vector<uint64_t>		tokenlist;

		uint64_t primary_key() const { return cdraftid; }
		uint64_t secondary_key() const {
			return Prim::gen_secondary_key(version, no);	
		}
		
		EOSLIB_SERIALIZE(cdraft, (cdraftid)(version)(no)(formal)(cname)
			(tags)(editors)(hash)(nofapproval)(approvers)(approved)(tasklist)(tokenlist))
	};
	typedef eosio::multi_index< 
			"cdraft"_n, cdraft,
			indexed_by<KEY2, const_mem_fun<cdraft, uint64_t, &cdraft::secondary_key>>
	> cdraft_def;

	bool can_edit(const eosio::name& sender, const vector<eosio::name>& editors);
	/**
	 * @brief generate version and no for new draft 
	 */
	void gen_draftno(const uint64_t& cipherid, uint16_t& version, uint16_t& no);

	void check_data4cipher(const eosio::name& sender, 
				const string& cname, const vector<eosio::name>& editors,
				const vector<string>& tags, const string& hash,
				const uint16_t& nofapproval, const vector<eosio::name>& approvers);
	void validate_tasklist(const uint64_t& cipherid, const vector<uint64_t>& tasklist);
	void validate_tokenlist(const vector<uint64_t>& tokenlist);
	bool is_draft_version(const uint64_t cipherid, const uint16_t version);
	bool is_cipher_exists(const uint64_t& cipherid); 
	bool is_cdraft_exists(const uint64_t& cipherid, const uint64_t& cdraftid);

/***************************************************************
 * Task
 ***************************************************************/
	const static int TASKNAME_MINLEN = 6;

	/**
	 * @brief information for the formal version of task 
	 */
	TABLE tformal {
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
	eosio::multi_index<
			"tformal"_n, tformal,
			indexed_by<KEY2, const_mem_fun<tformal, uint64_t, &tformal::secondary_key>>
	> tformal_data;

	/**
	 * @brief information for the draft version of task 
	 */
	TABLE tdraft {
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
	typedef eosio::multi_index<"tdraft"_n, tdraft> tdraft_def;

	bool is_tdraft_exists(const uint64_t cipherid, const uint64_t tdraftid);

	bool is_tformal_exists(const uint64_t tformalid);
	bool is_results_approved(const uint64_t tformalid);
	void formalize(const eosio::name sender, const uint64_t cipherid, const vector<uint64_t>& tasklist);
	bool pic_approved(const uint64_t tformalid);
	void check_data4task( 
				const eosio::name sender, const uint64_t cipherid,
				const string& taname, const uint64_t rewardid, 
				const uint64_t noftoken, const uint64_t amount, const uint8_t nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, const string& hash, 
				const vector<string>& tags);
	bool is_task_shared(const uint64_t tdraftid, const uint64_t cipherid, const uint64_t cdraftid);
		
/***************************************************************
 * Token
 ***************************************************************/
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
	TABLE token {
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
	TABLE issued {
		uint64_t		issueid;
		eosio::name		owner;
		uint64_t		quantity;
		uint8_t			status;
		name			payinf;
		
		uint64_t primary_key() const { return issueid; }
		uint64_t secondary_key() const { return owner.value; }

		EOSLIB_SERIALIZE( issued, (issueid)(owner)(quantity)(status)(payinf) )
	};
	/**
	 * @brief the definition of the table for "token"
	 */
	eosio::multi_index<
			"token"_n, token,
			indexed_by<KEY2, const_mem_fun<token, uint64_t, &token::secondary_key>>
	> token_data;

	/**
	 * @brief the definition of the table for "issue"
	 */
	typedef eosio::multi_index<
			"issued"_n, issued,
			indexed_by<KEY2, const_mem_fun<issued, uint64_t, &issued::secondary_key>>
	> issued_def;

	/**
	 * @brief issue a token 
	 */
	void issue_token(const eosio::name& sender, const uint64_t& cipherid,
			   const uint64_t& tokenid, const eosio::name& recipient, const uint64_t& quantity);
	void check_data4token(
			   const eosio::name sender, 
			   const string& tkname, const uint64_t issuer,
			   const uint64_t limit, const uint8_t when, 
			   const uint8_t disposal,const uint8_t type, const uint64_t taskid, 
			   const uint64_t extokenid, const uint64_t reftoken,  
			   const uint8_t rcalctype, const uint64_t nofdevtoken,
			   const uint64_t nofdesteos );

	bool is_token_shared(const uint64_t tokenid, const uint64_t cipherid, const uint64_t cdraftid);
	void distribute(const eosio::name sender, const uint64_t cipherid, 
					const uint64_t tokenid, const uint64_t quantity);
	void can_use(const token& tok, const issued& isu, const uint64_t quantity);
	//void transfer_currency(const eosio::name send, const eosio::name issuer, const uint32_t issuer2, const uint32_t quantity);

	uint64_t get_available_amount(const uint64_t tokenid);
	bool is_issued(const uint64_t tokeniid);
	void set_amount(const eosio::name sender, const uint64_t tokenid, const eosio::name user, const uint64_t quantity);
	bool is_sufficient_owned_token(const uint64_t issuer, const uint64_t tokenid, const uint64_t amount);
	bool is_token_exists(const uint64_t tokenid);
	void check_tokenowner(const uint64_t& tokenid, const uint64_t& cipherid);

/***************************************************************
 * Multisig 
 ***************************************************************/
	void sendProposeAction(const eosio::name& multisig, const name& proposal_name,
		const eosio::name& recipient, const uint64_t& amount, const string& memo, const vector<eosio::name>& approvals);

	void exec_multisig(const eosio::name& proposer, const name& proposal_name);
};

#endif // MYPHER_HPP
