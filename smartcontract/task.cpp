// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include "common/prim.hpp"
#include "common/validator.hpp"
#include "mypher.hpp"

using namespace eosio;
using namespace std;

void Mypher::tanew(const eosio::name& sender, const uint64_t& cipherid, const uint64_t& cdraftid,
				const string& taname, const uint64_t& rewardid, const uint64_t& noftoken, 
				const uint64_t& amount, const uint8_t& nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, 
				const string& hash,
				const vector<string>& tags) {

	tdraft_def d(_self, cipherid);
	uint64_t newid = d.available_primary_key();

	// check if specified draft of cipher exists
	cdraft_def cd(_self, cipherid);
	auto crec = cd.find(cdraftid);
	eosio_assert_code(crec!=cd.end(), NOT_FOUND);
	
	// check if cdraftid is later than formal version
	eosio_assert_code(is_draft_version(cipherid, crec->version), INVALID_PARAM);

	// common check
	check_data4task(sender, cipherid, taname, rewardid, noftoken, amount, nofapproval, approvers, 
				pic, hash, tags);
	
	// create new draft of task
	d.emplace(sender, [&](auto& dd) {
		dd.tdraftid = newid;
		dd.taname = taname;
		dd.rewardid = rewardid;
		dd.noftoken = noftoken;
		dd.amount = amount;
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

void Mypher::taupdate( const eosio::name& sender, 
				const uint64_t& cipherid, const uint64_t& cdraftid,
				const uint64_t& tdraftid, 
				const string& taname,  
				const uint64_t& rewardid, const uint64_t& noftoken, 
				const uint64_t& amount, const uint8_t& nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, const string& hash, 
				const vector<string>& tags) {

	tdraft_def d(_self, cipherid);
	auto rec = d.find(tdraftid);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	
	// get linked cdraft data
	cdraft_def cd(_self, cipherid);
	auto crec = cd.find(cdraftid);
	eosio_assert_code(crec!=cd.end(), INVALID_PARAM);

	// check if cdraftid is later than formal version
	eosio_assert_code(is_draft_version(cipherid, crec->version), INVALID_PARAM);
	
	// check data
	check_data4task(sender, cipherid, taname, rewardid, noftoken, amount, nofapproval, approvers, pic, hash, tags);

	// if task is shared between some drafts, generates copy
	if (is_task_shared(tdraftid, cipherid, cdraftid)) {
		uint64_t newid = d.available_primary_key();
		d.emplace(sender, [&](auto& dd) {
			dd.tdraftid = newid;
			dd.taname = taname;
			dd.rewardid = rewardid;
			dd.noftoken = noftoken;
			dd.amount = amount;
			dd.nofapproval = nofapproval;
			dd.approvers = approvers;
			dd.pic = pic;
			dd.hash = hash;
			dd.tags = tags;
		});
		// update tasklist in a draft of cipher clear approval list
		cd.modify(crec, sender, [&](auto& dd){
			std::replace(dd.tasklist.begin(), dd.tasklist.end(), rec->tdraftid, newid);
			dd.approved = vector<eosio::name>{};
		});
	} else {
		d.modify(rec, sender, [&](auto& dd){
			dd.taname = taname;
			dd.rewardid = rewardid;
			dd.noftoken = noftoken;
			dd.amount = amount;
			dd.nofapproval = nofapproval;
			dd.approvers = approvers;
			dd.pic = pic;
			dd.hash = hash;
			dd.tags = tags;
		});
		// clear approval list
		cd.modify(crec, sender, [&](auto& dd){
			dd.approved = vector<eosio::name>{};
		});
	}
}


void Mypher::taaprvpic(const eosio::name& sender, const uint64_t& tformalid, const bool& vec) {
	// check if sender is valid
	require_auth(sender);

	// get tformal data	
	auto tfrec = tformal_data.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tformal_data.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);

	// get cformal data
	auto cfrec = cformal_data.find(tfrec->cipherid);
	// check if data exists
	eosio_assert_code(cfrec!=cformal_data.end(), INVALID_PARAM);

	// get cdraft data
	cdraft_def cdd(_self, tfrec->cipherid);
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
	tformal_data.modify(tfrec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_pic.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_pic.begin(), dd.approve_pic.end(), sender);
			dd.approve_pic.erase(result, dd.approve_pic.end());
			dd.results = "";
			dd.payment = name{""_n};
		}
		dd.approve_results = vector<eosio::name>{};
	});
}

void Mypher::taaprvrslt( const eosio::name& sender, const uint64_t& tformalid, const bool& vec) {
	// check if sender is valid
	require_auth(sender);

	// get tformal data	
	auto tfrec = tformal_data.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tformal_data.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);

	// get cformal data
	auto cfrec = cformal_data.find(tfrec->cipherid);
	// check if data exists
	eosio_assert_code(cfrec!=cformal_data.end(), INVALID_PARAM);

	// get cdraft data
	cdraft_def cdd(_self, tfrec->cipherid);
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
	bool issue = (tdrec->rewardid!=NUMBER_NULL) && (tdrec->noftoken>0);
	tformal_data.modify(tfrec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_results.push_back(sender);
			if (issue) {
				dd.completed = true;
			}
		} else { // cancel approval
			auto result = std::remove(dd.approve_results.begin(), dd.approve_results.end(), sender);
			dd.approve_results.erase(result, dd.approve_results.end());
		}
	});
	// send the reward to pic
	if (tfrec->approve_results.size()>=tdrec->nofapproval) {
		if (issue) {
			for (auto it=tdrec->pic.begin(); it!=tdrec->pic.end(); ++it) {
				issue_token(sender, tfrec->cipherid, tdrec->rewardid, *it,
					(uint64_t)(tdrec->noftoken / tdrec->pic.size())
				);
			}
		}
	}
}

void Mypher::taaplypic( const eosio::name sender, const uint64_t tformalid, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	// get tformal data	
	auto tfrec = tformal_data.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tformal_data.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
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
			dd.pic = vector<eosio::name>{sender};	
		} else { // cancel approval
			auto result = std::remove(dd.pic.begin(), dd.pic.end(), sender);
			dd.pic.erase(result, dd.pic.end());
		}
	});
	if (!vec) {
		tformal_data.modify(tfrec, sender, [&](auto& dd) {
			// initialize approval for pic
			dd.approve_pic = vector<eosio::name>{};
			// initialize approval for results 
			dd.approve_results = vector<eosio::name>{};
		});
	}
}
void Mypher::taprrslt( const eosio::name sender, const uint64_t tformalid, const string& results) {
	// check if sender is fulfill the required auth
	require_auth(sender);

	// get tformal data	
	auto tfrec = tformal_data.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tformal_data.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);

	// check if pic is sender
	auto result = std::find(tdrec->pic.begin(), tdrec->pic.end(), sender);
	eosio_assert_code(result!=tdrec->pic.end(), PIC_IS_NOT_SENDER);
	// check if results already approved
	eosio_assert_code(Mypher::is_results_approved(tformalid)==false, TASK_COMPLETED);
	// set results to tformal
	tformal_data.modify(tfrec, sender, [&](auto& dd) {
		dd.approve_results = vector<eosio::name>{};
		dd.results = results;
	});
}

void Mypher::tareqpay( const eosio::name sender, const uint64_t tformalid, 
		const name& proposal_name, const vector<eosio::name>& approvals) {

	// check if sender is fulfill the required auth
	require_auth(sender);

	// get tformal data	
	auto tfrec = tformal_data.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tformal_data.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);

	// check if pic is sender
	auto result = std::find(tdrec->pic.begin(), tdrec->pic.end(), sender);
	eosio_assert_code(result!=tdrec->pic.end(), PIC_IS_NOT_SENDER);

	// check if results is not approved yet
	eosio_assert_code(Mypher::is_results_approved(tformalid)==true, RESULTS_IN_REVIEW);

	// set results to tformal
	tformal_data.modify(tfrec, sender, [&](auto& dd) {
		dd.payment = proposal_name;
	});

	auto rec3 = cformal_data.find(tfrec->cipherid);
	eosio_assert_code(rec3!=cformal_data.end(), NOT_FOUND);

	string memo("task#");
	char tmp[17];
	Prim::itoa16(tmp, tformalid);
	memo += tmp;
	sendProposeAction(
		rec3->multisig, proposal_name, sender, tdrec->amount, memo, approvals);
}

void Mypher::tafinish( const eosio::name& sender, const uint64_t& tformalid, const name& proposal_name) {
	// check if sender is fulfill the required auth
	require_auth(sender);

	// get tformal data	
	auto tfrec = tformal_data.find(tformalid);
	// check if data exists
	eosio_assert_code(tfrec!=tformal_data.end(), NOT_FOUND);

	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);
	// check if proposal_name is correct
	eosio_assert_code(tfrec->payment==proposal_name, INVALID_PARAM);

	// check if pic is sender
	auto result = std::find(tdrec->pic.begin(), tdrec->pic.end(), sender);
	eosio_assert_code(result!=tdrec->pic.end(), PIC_IS_NOT_SENDER);

	exec_multisig(sender, proposal_name);
	// set results to tformal
	tformal_data.modify(tfrec, sender, [&](auto& dd) {
		dd.completed = true;
	});
}

void Mypher::check_data4task( const eosio::name sender, const uint64_t cipherid,
				const string& taname, const uint64_t rewardid, 
				const uint64_t noftoken, const uint64_t amount, const uint8_t nofapproval, 
				const vector<eosio::name>& approvers, 
				const vector<eosio::name>& pic, const string& hash, 
				const vector<string>& tags) {

	// check if sender is fulfill the required auth
	require_auth(sender);

	// check if taname is set
	eosio_assert_code(taname.length()>=TASKNAME_MINLEN, INVALID_PARAM);
	
	// check if approver data is comformable
	eosio_assert_code((size_t)nofapproval<=approvers.size(), INVALID_PARAM);

	// check if approvers is invalid
	eosio_assert_code(check_person_list(approvers), INVALID_PARAM);
	
	// check if pic is invalid
	eosio_assert_code(check_person_list(pic), INVALID_PARAM);
	
	// check rewardid
	if (rewardid!=NUMBER_NULL) {
		check_tokenowner(rewardid, cipherid);
	}

	// check if approver is set
	eosio_assert_code(approvers.size()>0, INVALID_PARAM);

	// check if noftoken is set only in case that rewardid is set
	eosio_assert_code(
		(rewardid != NUMBER_NULL && noftoken != NUMBER_NULL) ||
		(rewardid == NUMBER_NULL && noftoken == NUMBER_NULL)
		, INVALID_REWARD);
	
	// check hash
	Validator::check_hash(hash);
}

bool Mypher::is_task_shared(const uint64_t tdraftid, const uint64_t cipherid, const uint64_t cdraftid) {
	cdraft_def d(_self, cipherid);
	for (auto it=d.begin(); it!=d.end(); ++it) {
		auto found = std::find(it->tasklist.begin(), it->tasklist.end(), tdraftid);
		if (cdraftid!=it->cdraftid && found!=it->tasklist.end()) return true;
	}
	return false;
}

bool Mypher::is_tdraft_exists(const uint64_t cipherid, const uint64_t tdraftid) {
	tdraft_def d(_self, cipherid);
	return (d.find(tdraftid)!=d.end());
}

bool Mypher::is_tformal_exists(const uint64_t tformalid) {
	return (tformal_data.find(tformalid)!=tformal_data.end());
}

bool Mypher::is_results_approved(const uint64_t tformalid) {
	auto tfrec = tformal_data.find(tformalid);
	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
	auto tdrec = tdd.find(tfrec->tdraftid);
	// check if data exists
	eosio_assert_code(tdrec!=tdd.end(), NOT_FOUND);

	uint64_t n = 0;
	for (auto it = tfrec->approve_results.begin(); it!=tfrec->approve_results.end(); ++it) {
		auto found = std::find(tdrec->approvers.begin(), tdrec->approvers.end(), *it);
		if (found!=tdrec->approvers.end()) {
			n++;
			if (n==tdrec->nofapproval) {
				return true;
			}
		}
	}
	return false;
}

void Mypher::formalize(const eosio::name sender, const uint64_t cipherid, const vector<uint64_t>& tasklist) {
	tdraft_def tdd(_self, cipherid);

	// delete task list of the previous version
	auto idx = tformal_data.get_index<KEY2>();
	auto rec = idx.find(cipherid);
	while(rec!=idx.end()) {
		auto prev = rec;
		rec++;
		idx.erase(prev);
	}

	// formalize task list of new version
	for (auto it=tasklist.begin(); it!=tasklist.end(); ++it) {
		auto rec = tdd.find(*it);
		auto newid = tformal_data.available_primary_key();
		eosio_assert_code(rec!=tdd.end(), INCONSISTENT_DATA_EXISTS);
		tformal_data.emplace(sender, [&](auto& dd) { 
			dd.tformalid = newid;
			dd.cipherid = cipherid; 
			dd.tdraftid = rec->tdraftid; 
			dd.taname = rec->taname;
			dd.tags = rec->tags;
			dd.results = "";
			dd.payment = name{""_n};
			dd.completed = false;
		});	
	}
}

bool Mypher::pic_approved(const uint64_t tformalid) {
	// get tformal data	
	auto tfrec = tformal_data.find(tformalid);
	// check if data exists
	if (tfrec==tformal_data.end()) {
		return false;
	}
	// get tdraft data 
	tdraft_def tdd(_self, tfrec->cipherid);
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
