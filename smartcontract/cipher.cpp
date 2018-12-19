// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include <boost/range/iterator_range.hpp>
#include "mypher.hpp"
#include "common/prim.hpp"
#include "common/validator.hpp"
#include "token.hpp"
#include "task.hpp"

namespace mypher {

using namespace eosio;

uint64_t Cipher::gen_secondary_key(const uint16_t& ver, const uint16_t& draftno) {
	uint64_t ret = (uint64_t{ver} << 16) | draftno;
	return ret;
}

void Cipher::gen_draftno(const uint64_t cipherid, uint16_t& version, uint16_t& draftno ) {
	cformal_data d1(self, self);
	auto rec1 = d1.find(cipherid);
	eosio_assert_code(rec1!=d1.end(), NOT_FOUND);
	
	cdraft_data d2(self, cipherid);
	auto rec2 = d2.find(rec1->cdraftid);
	eosio_assert_code(rec2!=d2.end(), NOT_FOUND);

	// version is next number of formal version
	version = rec2->version + 1;

	auto idx = d2.get_index<N(secondary_key)>();
	auto rec3 = idx.rbegin();
	eosio_assert_code(rec3!=idx.rend(), NOT_FOUND);
	
	// if the version of most recent draft is already formaled, then 1
	// if is not formaled, then recent draftno +1
	draftno = (rec2->version==rec3->version) ? 1 : rec3->no + 1;
}

bool Cipher::is_draft_version(const uint64_t cipherid, const uint16_t version) {
	cformal_data d1(SELF, SELF);
	auto rec1 = d1.find(cipherid);
	eosio_assert_code(rec1!=d1.end(), NOT_FOUND);
	cdraft_data d2(SELF,cipherid);
	auto rec2 = d2.find(rec1->cdraftid);
	eosio_assert_code(rec2!=d2.end(), NOT_FOUND);
	return (rec2->version<version);
}

void Cipher::cnew(const account_name sender, 
				const string& name, const vector<account_name>& editors,
				const vector<string>& tags, const string& hash,
				uint16_t nofapproval, const vector<account_name>& approvers) {

	// check data
	check_data(sender, name, editors, tags, hash, nofapproval, approvers);

	cformal_data d1(self, self);
	uint64_t cipherid = d1.available_primary_key();
	cdraft_data d2(self, cipherid);
	uint64_t cdraftid = d2.available_primary_key();

	// insert new formal version
	d1.emplace(sender, [&](auto& dd) {
	 	dd.cipherid = cipherid;
		dd.cdraftid = cdraftid;
		dd.name = name;
		dd.tags = tags;
	});

	// insert new draft data
	d2.emplace(sender, [&](auto& dd) {
		dd.cdraftid = cdraftid;
		dd.version = 1;
		dd.no = 1;
		dd.formal = true;
		dd.name = name;
		dd.tags = tags;
		dd.editors = editors;
		dd.hash = hash;
		dd.nofapproval = nofapproval;
		dd.approvers = approvers;
	});
}

void Cipher::cnewdraft(const account_name sender, const uint64_t cipherid, const uint64_t cdraftid) {
	
	require_auth(sender);

	cdraft_data d(self, cipherid);
	uint64_t newid = d.available_primary_key();
	uint16_t version, draftno;
	vector<account_name> editors;

	auto rec = d.find(draftno);
	gen_draftno(cipherid, version, draftno);

	editors.push_back(sender);
	// insert new draft
	d.emplace(sender, [&](auto& dd) {
		dd.cdraftid = newid;
		dd.version = version;
		dd.no = draftno;
		dd.formal = false;
		dd.name = rec->name;
		dd.tags = rec->tags;
		dd.editors = editors;
		dd.hash = rec->hash;
		dd.nofapproval = rec->nofapproval;
		dd.approvers = rec->approvers;
		dd.tasklist = rec->tasklist;
		dd.tokenlist = rec->tokenlist;
	});
}

void Cipher::cupdate(const account_name sender, const uint64_t cipherid, 
				const uint64_t cdraftid, const uint16_t version, const uint16_t draftno, 
				const string& name, const vector<string>& tags, 
				const vector<account_name>& editors, const string& hash,
				const uint16_t nofapproval, const vector<account_name>& approvers,
				const vector<uint64_t>& tasklist, const vector<uint64_t>& tokenlist) {

    // common check
	check_data(sender, name, editors, tags, hash, nofapproval, approvers);

	// check if version is already formal
	eosio_assert_code(is_draft_version(cipherid, version), ALREADY_FORMAL);
	// check if task list is valid
	validate_tasklist(cipherid, tasklist);
	// check if token list is valid
	validate_tokenlist(tokenlist);

	cdraft_data d(self, cipherid);
	auto rec = d.find(cdraftid);
	// check if draft is exists
	eosio_assert_code(rec==d.end(), NOT_FOUND);
	eosio_assert_code((version==rec->version && draftno==rec->no), NOT_FOUND);
	// check if sender can edit this draft
	eosio_assert_code(can_edit(sender, rec->editors), SENDER_CANT_EDIT);
	// update data
	d.modify(rec, sender, [&](auto& dd) {
		dd.name = name;
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

void Cipher::capprove(const account_name sender, const uint64_t cipherid, const uint64_t cdraftid) {
	// check if sender is logined user
	require_auth(sender);

	cdraft_data d(self, cipherid);
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
		cformal_data d2(self, self);
		auto rec2 = d2.find(cipherid);
		d2.modify(rec2, sender, [&](auto& dd) {
			dd.cdraftid = rec->cdraftid;
			dd.name = rec->name;
			dd.tags = rec->tags;
		});
	}
}

void Cipher::crevapprove(const account_name sender, const uint64_t cipherid, const uint64_t cdraftid) {
	require_auth(sender);

	// check if sender is logined user
	cdraft_data d(self, cipherid);
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

bool Cipher::can_edit(const account_name& sender, const vector<account_name>& editors) {
	auto found = std::find(editors.begin(), editors.end(), sender);
	return (found!=editors.end());
}


bool Cipher::exists(const uint64_t cipherid) {
	cformal_data d(SELF, SELF);
	auto rec = d.find(cipherid);
	return (rec!=d.end());
}

void Cipher::check_data(const account_name sender, 
				const string& name, const vector<account_name>& editors,
				const vector<string>& tags, const string& hash,
				uint16_t nofapproval, const vector<account_name>& approvers) {
	// check if sender is logined user
	require_auth(sender);

	// check if editors is valid
	eosio_assert_code(editors.size()>0, INVALID_PARAM);
	eosio_assert_code(Person::check_list(editors), INVALID_PARAM);

	// check if approvers is valid
	eosio_assert_code(approvers.size()>0, INVALID_PARAM);
	eosio_assert_code(Person::check_list(approvers), INVALID_PARAM);

	// check hash
	Validator::check_hash(hash);
}

void Cipher::validate_tasklist(const uint64_t cipherid, const vector<uint64_t>& list) {
	Task::tdraft_data d(SELF, cipherid);
	for (auto it = list.begin(); it!=list.end(); ++it ) {
		auto rec = d.find(*it);
		eosio_assert_code(rec!=d.end(), INVALID_TASK);
	}
}

void Cipher::validate_tokenlist(const vector<uint64_t>& list) {
	Token::token_data d(SELF, SELF);
	for (auto it = list.begin(); it!=list.end(); ++it ) {
		auto rec = d.find(*it);
		eosio_assert_code(rec!=d.end(), INVALID_TOKEN);
	}
}

bool Cipher::is_draft_exists(const uint64_t cipherid, const uint64_t cdraftid) {
	cdraft_data d(SELF, cipherid);
	auto rec = d.find(cdraftid);
	return (rec!=d.end());
}

} // mypher