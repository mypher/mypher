// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include "mypher.hpp"
#include "common/prim.hpp"
#include "common/validator.hpp"

using namespace eosio;

void Mypher::gen_draftno(const uint64_t& cipherid, uint16_t& version, uint16_t& no ) {
	auto rec1 = cformal_data.find(cipherid);
	eosio_assert_code(rec1!=cformal_data.end(), NOT_FOUND);
	
	cdraft_def d2(_self, cipherid);
	auto rec2 = d2.find(rec1->cdraftid);
	eosio_assert_code(rec2!=d2.end(), NOT_FOUND);

	// version is next number of formal version
	version = rec2->version + 1;

	auto idx = d2.get_index<KEY2>();
	auto rec3 = idx.rbegin();
	eosio_assert_code(rec3!=idx.rend(), NOT_FOUND);
	
	// if the version of most recent draft is already formaled, then 1
	// if is not formaled, then recent no +1
	no = (rec2->version==rec3->version) ? 1 : rec3->no + 1;
}

bool Mypher::is_draft_version(const uint64_t cipherid, const uint16_t version) {
	auto rec1 = cformal_data.find(cipherid);
	eosio_assert_code(rec1!=cformal_data.end(), NOT_FOUND);
	cdraft_def d2(_self,cipherid);
	auto rec2 = d2.find(rec1->cdraftid);
	eosio_assert_code(rec2!=d2.end(), NOT_FOUND);
	return (rec2->version<version);
}

void Mypher::cnew(const eosio::name& sender, 
				const string& cname, const vector<eosio::name>& editors,
				const eosio::name& multisig,
				const vector<string>& tags, const string& hash,
				const uint16_t& nofapproval, const vector<eosio::name>& approvers) {
	
	check_data4cipher(sender, cname, editors, tags, hash, nofapproval, approvers);

	eosio_assert_code(is_account(multisig), INVALID_MULTISIG);

	uint64_t cipherid = cformal_data.available_primary_key();
	cdraft_def d2(_self, cipherid);
	uint64_t cdraftid = d2.available_primary_key();

	// insert new formal version
	cformal_data.emplace(sender, [&](auto& dd) {
	 	dd.cipherid = cipherid;
		dd.cdraftid = cdraftid;
		dd.multisig = multisig;
		dd.cname = cname;
		dd.tags = tags;
	});

	// insert new draft data
	d2.emplace(sender, [&](auto& dd) {
		dd.cdraftid = cdraftid;
		dd.version = 1;
		dd.no = 1;
		dd.formal = true;
		dd.cname = cname;
		dd.tags = tags;
		dd.editors = editors;
		dd.hash = hash;
		dd.nofapproval = nofapproval;
		dd.approvers = approvers;
	});
}

void Mypher::cnewdraft(const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid) {
	
	require_auth(sender);

	cdraft_def d(_self, cipherid);
	uint64_t newid = d.available_primary_key();
	uint16_t version, no;
	vector<eosio::name> editors;

	auto rec = d.find(cdraftid);
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	gen_draftno(cipherid, version, no);

	editors.push_back(sender);
	// insert new draft
	d.emplace(sender, [&](auto& dd) {
		dd.cdraftid = newid;
		dd.version = version;
		dd.no = no;
		dd.formal = false;
		dd.cname = rec->cname;
		dd.tags = rec->tags;
		dd.editors.push_back(sender);
		dd.hash = rec->hash;
		dd.nofapproval = rec->nofapproval;
		dd.approvers = rec->approvers;
		dd.tasklist = rec->tasklist;
		dd.tokenlist = rec->tokenlist;
	});
}

void Mypher::cupdate(const eosio::name& sender, const uint64_t& cipherid, 
				const uint64_t& cdraftid, const uint16_t& version, const uint16_t& no, 
				const string& cname, const vector<string>& tags, 
				const vector<eosio::name>& editors, const string& hash,
				const uint16_t& nofapproval, const vector<eosio::name>& approvers,
				const vector<uint64_t>& tasklist, const vector<uint64_t>& tokenlist) {

    // common check
	check_data4cipher(sender, cname, editors, tags, hash, nofapproval, approvers);

	// check if version is already formal
	eosio_assert_code(is_draft_version(cipherid, version), ALREADY_FORMAL);
	// check if task list is valid
	validate_tasklist(cipherid, tasklist);
	// check if token list is valid
	validate_tokenlist(tokenlist);

	cdraft_def d(_self, cipherid);
	auto rec = d.find(cdraftid);
	// check if draft is exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	eosio_assert_code((version==rec->version && no==rec->no), NOT_FOUND);
	// check if sender can edit this draft
	eosio_assert_code(can_edit(sender, rec->editors), SENDER_CANT_EDIT);
	// update data
	d.modify(rec, sender, [&](auto& dd) {
		dd.cname = cname;
		dd.tags = tags;
		dd.editors = editors;
		dd.hash = hash;
		dd.nofapproval = nofapproval;
		dd.approvers = approvers;
		dd.approved.clear();
		dd.tasklist = tasklist;
		dd.tokenlist = tokenlist;
	});
}

void Mypher::capprove(const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid) {
	// check if sender is logined user
	require_auth(sender);

	cdraft_def d(_self, cipherid);
	auto rec = d.find(cdraftid);
	// check if the draft is exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	// check if the version is formal
	eosio_assert_code(is_draft_version(cipherid, rec->version), ALREADY_FORMAL);
	// check if sender is contained in approver
	auto found = std::find(rec->approvers.begin(), rec->approvers.end(), sender);
	eosio_assert_code(found!=rec->approvers.end(), SENDER_NOT_APPROVER);
	// check if sender already approved
	found = std::find(rec->approved.begin(), rec->approved.end(), sender);
	eosio_assert_code(found==rec->approved.end(), SENDER_ALREADY_APPROVE); 
	// update data
	bool formal = false;
	d.modify(rec, sender, [&](auto& dd) {
		dd.approved.push_back(sender);
		// if fulfilled the requirement, draft become formal
		if (dd.approved.size()==dd.nofapproval) {
			dd.formal = true;
			formal = true;
		}
	});
	// update formal information if the draft became formal version
	if (formal) {
		auto rec2 = cformal_data.find(cipherid);
		cformal_data.modify(rec2, sender, [&](auto& dd) {
			dd.cdraftid = rec->cdraftid;
			dd.cname = rec->cname;
			dd.tags = rec->tags;
		});
		formalize(sender, cipherid, rec->tasklist);
	}
}

void Mypher::crevapprove(const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid) {
	require_auth(sender);

	// check if sender is logined user
	cdraft_def d(_self, cipherid);
	// check if data is registered
	auto rec = d.find(cdraftid);
	// check if the draft is exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	// check if the version is formal
	eosio_assert_code(is_draft_version(cipherid, rec->version), ALREADY_FORMAL);
	// check if sender is contained in approver
	auto found = find(rec->approvers.begin(), rec->approvers.end(), sender);
	eosio_assert_code(found!=rec->approvers.end(), SENDER_NOT_APPROVER);
	// check if sender doesn't approve yet
	found = find(rec->approved.begin(), rec->approved.end(), sender);
	eosio_assert_code(found!=rec->approved.end(), SENDER_NOT_APPROVE_YET); 
	// update data
	d.modify(rec, sender, [&](auto& dd) {
		auto result = remove(dd.approved.begin(), dd.approved.end(), sender);
		dd.approved.erase(result, dd.approved.end());
	});
}

bool Mypher::can_edit(const eosio::name& sender, const vector<eosio::name>& editors) {
	auto found = std::find(editors.begin(), editors.end(), sender);
	return (found!=editors.end());
}


bool Mypher::is_cipher_exists(const uint64_t& cipherid) {
	auto rec = cformal_data.find(cipherid);
	return (rec!=cformal_data.end());
}

void Mypher::check_data4cipher(const eosio::name& sender, 
				const string& cname, const vector<eosio::name>& editors,
				const vector<string>& tags, const string& hash,
				const uint16_t& nofapproval, const vector<eosio::name>& approvers) {
	// check if sender is logined user
	require_auth(sender);

	// check if "cname" is of sufficient length
	eosio_assert_code(cname.length()>=CIPHERNAME_MINLEN, INVALID_PARAM);

	// check if editors is valid
	eosio_assert_code(editors.size()>0, INVALID_PARAM);
	eosio_assert_code(check_person_list(editors), INVALID_PARAM);

	// check if approvers is valid
	eosio_assert_code(approvers.size()>0, INVALID_PARAM);
	eosio_assert_code(check_person_list(approvers), INVALID_PARAM);

	// check if nofapproval is valid
	eosio_assert_code(nofapproval>0, INVALID_PARAM);
	eosio_assert_code(nofapproval<=approvers.size(), INVALID_PARAM);

	// check hash
	Validator::check_hash(hash);
}

void Mypher::validate_tasklist(const uint64_t& cipherid, const vector<uint64_t>& list) {
	tdraft_def d(_self, cipherid);
	for (auto it = list.begin(); it!=list.end(); ++it ) {
		auto rec = d.find(*it);
		eosio_assert_code(rec!=d.end(), INVALID_PARAM);
	}
}

void Mypher::validate_tokenlist(const vector<uint64_t>& list) {
	for (auto it = list.begin(); it!=list.end(); ++it ) {
		auto rec = token_data.find(*it);
		eosio_assert_code(rec!=token_data.end(), INVALID_PARAM);
	}
}

bool Mypher::is_cdraft_exists(const uint64_t& cipherid, const uint64_t& cdraftid) {
	cdraft_def d(_self, cipherid);
	auto rec = d.find(cdraftid);
	return (rec!=d.end());
}

