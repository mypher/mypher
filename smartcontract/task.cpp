// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include <boost/range/iterator_range.hpp>
#include "task.hpp"
#include "token.hpp"
#include "cipher.hpp"
#include "person.hpp"
#include "common/validator.hpp"
using namespace eosio;
using namespace std;

namespace mypher {

void Task::tanew(const account_name sender, const uint64_t cipherid, const uint64_t cdraftid,
				const string& name, const uint64_t rewardid, const uint64_t quantity, 
				const uint8_t nofapproval, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, 
				const string& hash,
				const vector<string>& tags) {

	tdraft_data d(self, cipherid);
	uint64_t newid = d.available_primary_key();

	// check if specified draft of cipher exists
	Cipher::cdraft_data cd(self, cipherid);
	auto crec = cd.find(cdraftid);
	eosio_assert_code(crec!=cd.end(), NOT_FOUND);
	
	// check if cdraftid is later than formal version
	eosio_assert_code(Cipher::is_draft_version(cipherid, cdraftid), INVALID_PARAM);

	// common check
	check_data(sender, cipherid, name, rewardid, quantity, nofapproval, approvers, 
				pic, hash, tags);
	
	// create new draft of task
	d.emplace(sender, [&](auto& dd) {
		dd.tdraftid = newid;
		dd.name = name;
		dd.rewardid = rewardid;
		dd.quantity = quantity;
		dd.nofapproval = nofapproval;
		dd.approvers = approvers;
		dd.pic = pic;
		dd.hash = hash;
		dd.tags = tags;
	});

	// update tasklist in specified draft of cipher
	cd.modify(crec, sender, [&](auto& dd){
		dd.tasklist.push_back(newid);	
	});
}

void Task::taupdate( const account_name sender, 
				const uint64_t cipherid, const uint64_t cdraftid,
				const uint64_t tdraftid, 
				const string& name,  
				const uint64_t rewardid, const uint64_t quantity, 
				const uint8_t nofapproval, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, const string& hash, 
				const vector<string>& tags) {

	tdraft_data d(self, cipherid);
	auto rec = d.find(tdraftid);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);

	// check if cdraftid is later than formal version
	eosio_assert_code(Cipher::is_draft_version(cipherid, cdraftid), INVALID_PARAM);
	
	// check data
	check_data(sender, cipherid, name, rewardid, quantity, nofapproval, approvers, pic, hash, tags);

	// get linked cdraft data
	Cipher::cdraft_data cd(self, cipherid);
	auto crec = cd.find(cdraftid);
	eosio_assert_code(crec!=cd.end(), INVALID_PARAM);

	// if task is shared between some drafts, generates copy
	if (is_shared(tdraftid, cipherid, cdraftid)) {
		uint64_t newid = d.available_primary_key();
		d.emplace(sender, [&](auto& dd) {
			dd.tdraftid = newid;
			dd.name = name;
			dd.rewardid = rewardid;
			dd.quantity = quantity;
			dd.nofapproval = nofapproval;
			dd.approvers = approvers;
			dd.pic = pic;
			dd.hash = hash;
			dd.tags = tags;
		});
		// update tasklist in a draft of cipher clear approval list
		cd.modify(crec, sender, [&](auto& dd){
			std::replace(dd.tasklist.begin(), dd.tasklist.end(), rec->tdraftid, newid);
			dd.approved = vector<account_name>{};
		});
	} else {
		d.modify(rec, sender, [&](auto& dd){
			dd.name = name;
			dd.rewardid = rewardid;
			dd.quantity = quantity;
			dd.nofapproval = nofapproval;
			dd.approvers = approvers;
			dd.pic = pic;
			dd.hash = hash;
			dd.tags = tags;
		});
		// clear approval list
		cd.modify(crec, sender, [&](auto& dd){
			dd.approved = vector<account_name>{};
		});
	}
}


void Task::taaprvpic(const account_name sender, const uint64_t tformalid, const bool vec) {
	// check if sender is valid
	require_auth(sender);

	// get tformal data	
	tformal_data tfd(self, self);
	auto tfrec = tfd.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tfd.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_data tdd(self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);

	// get cformal data
	Cipher::cformal_data cfd(self, self);
	auto cfrec = cfd.find(tfrec->cipherid);
	// check if data exists
	eosio_assert_code(cfrec!=cfd.end(), INVALID_PARAM);

	// get cdraft data
	Cipher::cdraft_data cdd(self, tfrec->cipherid);
	auto cdrec = cdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(cdrec!=cdd.end(), INVALID_PARAM);

	// check if sender is approver or pic
	auto result1 = std::find(cdrec->approvers.begin(), cdrec->approvers.end(), sender);
	auto result2 = std::find(tdrec->pic.begin(), tdrec->pic.end(), sender);
	eosio_assert_code(
		(result1!=cdrec->approvers.end()) || (result2!=tdrec->pic.end()), 
		SENDER_NOT_APPROVER);

	// check if sender already approve the pic
	auto result3 = std::find(tfrec->approve_pic.begin(), tfrec->approve_pic.end(), sender);
	if (vec) { // approve
		// check if pic is not set yet
		eosio_assert_code(tdrec->pic.size()>0, PIC_NOT_ASSIGNED);
		// check if sender already approved pic
		eosio_assert_code(result3 == tfrec->approve_pic.end(), SENDER_ALREADY_APPROVE);
	} else { //cancel approval 
		// check if sender doesn't approve pic yet
		eosio_assert_code(result3 != tfrec->approve_pic.end(), SENDER_NOT_APPROVE_YET);
		// check if resutls is being reviewed
		eosio_assert_code(tfrec->approve_results.size()==0, RESULTS_IN_REVIEW);
	}
	// update approval lists
	tfd.modify(tfrec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_pic.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_pic.begin(), dd.approve_pic.end(), sender);
			dd.approve_pic.erase(result, dd.approve_pic.end());
		}
		dd.approve_results = vector<account_name>{};
	});
}

void Task::taaprvrslt( const account_name sender, const uint64_t tformalid, const bool vec) {
	// check if sender is valid
	require_auth(sender);

	// get tformal data	
	tformal_data tfd(self, self);
	auto tfrec = tfd.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tfd.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_data tdd(self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);

	// get cformal data
	Cipher::cformal_data cfd(self, self);
	auto cfrec = cfd.find(tfrec->cipherid);
	// check if data exists
	eosio_assert_code(cfrec!=cfd.end(), INVALID_PARAM);

	// get cdraft data
	Cipher::cdraft_data cdd(self, tfrec->cipherid);
	auto cdrec = cdd.find(tfrec->tdraftid);

	// check if data exists
	eosio_assert_code(cdrec!=cdd.end(), INVALID_PARAM);
	
	// check if sender is approver
	auto result1 = std::find(cdrec->approvers.begin(), cdrec->approvers.end(), sender);
	eosio_assert_code(result1 != cdrec->approvers.end(), SENDER_NOT_APPROVER);

	// check if results is already approved
	auto result2 = std::find(tfrec->approve_results.begin(), tfrec->approve_results.end(), sender);
	// check if required number of approvers approve pic
	eosio_assert_code(pic_approved(tformalid), PIC_NOT_APPROVED);
	// check if already approval requirements for results are already fulfilled
	eosio_assert_code(cdrec->nofapproval>tfrec->approve_results.size(), TASK_COMPLETED);
	// check if sender approve results
	auto result4 = std::find(tfrec->approve_results.begin(), tfrec->approve_results.end(), sender);
	if (vec) { // approve
		// check if pic is not set yet
		eosio_assert_code(tdrec->pic.size()>0, PIC_NOT_ASSIGNED);
		// check if sender already approve results
		eosio_assert_code(result4==tfrec->approve_results.end(), SENDER_ALREADY_APPROVE);
	} else { //cancel approval 
		// check if sender does't approve results
		eosio_assert_code(result4!=tfrec->approve_results.end(), SENDER_NOT_APPROVE_YET);
	}
	tfd.modify(tfrec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_results.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_results.begin(), dd.approve_results.end(), sender);
			dd.approve_results.erase(result, dd.approve_results.end());
		}
	});
	// send the reward to pic
	if (tfrec->approve_results.size()>=cdrec->nofapproval) {
		// TODO:
	}
}

void Task::applyforpic( const account_name sender, const uint64_t tformalid, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	// get tformal data	
	tformal_data tfd(self, self);
	auto tfrec = tfd.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tfd.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_data tdd(self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);
	
	if (vec) { // apply
		// check if pic is set
		eosio_assert_code(tdrec->pic.size()==0, PIC_IS_ASSIGNED);
	} else { // cancel application
		// check if pic is sender
		auto result = std::find(tdrec->pic.begin(), tdrec->pic.end(), sender);
		eosio_assert_code(result!=tdrec->pic.end(), PIC_IS_NOT_SENDER);
	}

	tdd.modify(tdrec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.pic = vector<account_name>{sender};	
		} else { // cancel approval
			auto result = std::remove(dd.pic.begin(), dd.pic.end(), sender);
			dd.pic.erase(result, dd.pic.end());
		}
	});
	if (!vec) {
		tfd.modify(tfrec, sender, [&](auto& dd) {
			// initialize approval for pic
			dd.approve_pic = vector<account_name>{};
			// initialize approval for results 
			dd.approve_results = vector<account_name>{};
		});
	}
}

void Task::check_data( const account_name sender, const uint64_t cipherid,
				const string& name, const uint64_t rewardid, 
				const uint64_t quantity, const uint8_t nofapproval, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, const string& hash, 
				const vector<string>& tags) {

	// check if sender is fulfill the required auth
	require_auth(sender);

	// check if name is set
	eosio_assert_code(name.length()>=NAME_MINLEN, INVALID_PARAM);
	
	// check if approver data is comformable
	eosio_assert_code((size_t)nofapproval<=approvers.size(), INVALID_PARAM);

	// check if approvers is invalid
	eosio_assert_code(Person::check_list(approvers), INVALID_PARAM);
	
	// check if pic is invalid
	eosio_assert_code(Person::check_list(pic), INVALID_PARAM);
	
	// check rewardid
	if (rewardid!=NUMBER_NULL) {
		Validator::check_tokenowner(rewardid, cipherid);
	}

	// check if approver is set
	eosio_assert_code(approvers.size()>0, INVALID_PARAM);

	// check if quantity is set only in case that rewardid is set
	eosio_assert_code(
		(rewardid != NUMBER_NULL && quantity != NUMBER_NULL) ||
		(rewardid == NUMBER_NULL && quantity == NUMBER_NULL)
		, INVALID_REWARD);
	
	// check hash
	Validator::check_hash(hash);
}

bool Task::is_shared(const uint64_t tdraftid, const uint64_t cipherid, const uint64_t cdraftid) {
	Cipher::cdraft_data d(SELF, cipherid);
	for (auto it=d.begin(); it!=d.end(); ++it) {
		auto found = std::find(it->tasklist.begin(), it->tasklist.end(), tdraftid);
		if (cdraftid!=it->cdraftid && found!=it->tasklist.end()) return true;
	}
	return false;
}

bool Task::exists(const uint64_t tformalid) {
	tformal_data d(SELF, SELF);
	return (d.find(tformalid)!=d.end());
}

bool Task::completed(const uint64_t tformalid) {
	tformal_data tfd(SELF, SELF);
	auto tfrec = tfd.find(tformalid);
	Cipher::cformal_data cfd(SELF, SELF);
	auto cfrec = cfd.find(tfrec->cipherid);
	Cipher::cdraft_data cdd(SELF, tfrec->cipherid);
	auto cdrec = cdd.find(cfrec->cdraftid);
	uint64_t n = 0;
	for (auto it = tfrec->approve_results.begin(); it!=tfrec->approve_results.end(); ++it) {
		auto found = std::find(cdrec->approvers.begin(), cdrec->approvers.end(), *it);
		if (found!=cdrec->approvers.end()) {
			n++;
			if (n==cdrec->nofapproval) {
				return true;
			}
		}
	}
	return false;
}

void Task::formalize(const account_name sender, const uint64_t cipherid, const vector<uint64_t>& tasklist) {
	tformal_data tfd(SELF, SELF); 
	tdraft_data tdd(SELF, cipherid);

	// delete task list of the previous version
	auto idx = tfd.get_index<N(secondary_key)>();
	auto rec = idx.find(cipherid);
	while(rec!=idx.end()) {
		auto prev = rec;
		rec++;
		idx.erase(prev);
	}

	// formalize task list of new version
	for (auto it=tasklist.begin(); it!=tasklist.end(); ++it) {
		auto rec = tdd.find(*it);
		eosio_assert_code(rec!=tdd.end(), INCONSISTENT_DATA_EXISTS);
		tfd.emplace(sender, [&](auto& dd) { 
			dd.cipherid = cipherid; 
			dd.tdraftid = rec->tdraftid; 
			dd.name = rec->name;
			dd.tags = rec->tags;
		});	
	}
}

bool Task::pic_approved(const uint64_t tformalid) {
	// get tformal data	
	tformal_data tfd(SELF, SELF);
	auto tfrec = tfd.find(tformalid);
	// check if data exists
	if (tfrec==tfd.end()) {
		return false;
	}
	// get tdraft data 
	tdraft_data tdd(SELF, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	if (tdrec==tdd.end()) {
		return false;
	}
	// check if number of approvals by approvers is more than the requirement
	uint64_t cnt = 0;
	for (auto it=tfrec->approve_pic.begin(); it!=tfrec->approve_pic.end(); ++it) {
		auto found = std::find(tdrec->approvers.begin(), tdrec->approvers.end(), *it);
		cnt += (found!=tdrec->approvers.end()) ? 1 : 0;
	} 
	if (cnt<tdrec->nofapproval) {
		return false;
	}
	// check if all members approve the pic members
	for (auto it=tdrec->pic.begin(); it!=tdrec->pic.end(); ++it) {
		auto found = std::find(tfrec->approve_pic.begin(), tfrec->approve_pic.end(), *it);
		if (found==tfrec->approve_pic.end()) {
			return false;
		}
	} 
	return true;
}

} // mypher