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

void Task::tanew(const account_name sender, const uint64_t cid, 
				const string& name, const uint64_t rewardid, const uint64_t rquantity, 
				const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, 
				const string& hash,
				const vector<string>& tags) {

	data d(self, self);
	Cipher::data cd(self, self);
	uint64_t cipherid = NUMBER_NULL;
	uint64_t id = d.available_primary_key();
	auto update = [&]() {
		// check data
		account_name owner = (cid==NUMBER_NULL) ? sender : N("");
		checkdata(sender, owner, cid, name, rewardid, rquantity, nofauth, approvers, pic, hash, tags);
		eosio::print("#tanew#", sender, ":", id);
		d.emplace(sender, [&](auto& dd) {
			dd.id = id;
			dd.cipherid = cipherid;
			dd.owner = owner;
			dd.name = name;
			dd.rewardid = rewardid;
			dd.rquantity = rquantity;
			dd.nofauth = nofauth;
			dd.approvers = approvers;
			dd.pic = pic;
			dd.hash = hash;
			dd.tags = tags;
		});
	};

	// check if specified hash is valid
	Validator::check_hash(hash);

	// if this task is owned by any cipher, check and update that cipher
	if (cid!=NUMBER_NULL) {
		// check if specified cipher is exists
		auto crec = cd.find(cid);
		eosio_assert_code(crec!=cd.end(), CIPHER_NOT_FOUND);
		cipherid = crec->cipherid;
		update();
		// append the task to the cipher
		cd.modify(crec, sender, [&](auto& dd){
			dd.tasklist.push_back(id);	
		});
	} else {
		update();
	}
}

void Task::taupdate( const account_name sender, 
				const uint64_t cid, const uint64_t id, 
				const string& name,  
				const uint64_t rewardid, const uint64_t rquantity, 
				const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, 
				const string& hash,
				const vector<string>& tags) {

	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);

	// if results is already approved, task can't change
	eosio_assert_code(!is_results_approved(*rec), RESULTS_ALREADY_APPROVED);
	
	// check data
	checkdata(sender, rec->owner, cid, name, rewardid, rquantity, nofauth, approvers, pic, hash, tags);

	// check if task is already formal
	// TODO:bug
	if (rec->cipherid!=NUMBER_NULL) {
		Cipher::data d2(self, self);
		auto rec2 = d2.find(rec->cipherid);
		eosio_assert_code(rec2!=d2.end(), CIPHER_NOT_FOUND);
		eosio_assert_code(!rec2->formal, ALREADY_FORMAL);
	}
	// check if task is approved
	eosio_assert_code(!is_task_approved(*rec), TASK_ALREADY_APPROVED);

	// check if hash is valid
	Validator::check_hash(hash);

	// if task is shared between some drafts, generates copy
	if (is_shared(id, cid)) {
		uint64_t id = d.available_primary_key();
		d.emplace(sender, [&](auto& dd) {
			dd.id = id;
			dd.cipherid = rec->cipherid;
			dd.owner = sender;
			dd.name = name;
			dd.rewardid = rewardid;
			dd.rquantity = rquantity;
			dd.nofauth = nofauth;
			dd.pic = pic;
			dd.hash = hash;
			dd.tags = tags;
		});
		// update the id registered in cipher to new one
		Cipher::data cd(self, self);
		auto crec = cd.find(cid);
		eosio_assert_code(crec->cipherid==rec->cipherid, CIPHER_NOT_FOUND);
		cd.modify(crec, sender, [&](auto& dd){
			std::replace(dd.tasklist.begin(), dd.tasklist.end(), rec->id, id);
		});
	} else {
		d.modify(rec, sender, [&](auto& dd){
			dd.name = name;
			dd.rewardid = rewardid;
			dd.rquantity = rquantity;
			dd.nofauth = nofauth;
			dd.approvers = approvers;
			dd.hash = hash;
			dd.tags = tags;
			dd.approve_task = vector<account_name>{};
			if (dd.pic!=pic) {
				dd.approve_pic = vector<account_name>{};
			}
			dd.pic = pic;
		});
	}
}

void Task::taaprvtask( const account_name sender, const uint64_t id, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	// check if sender is approver or approved pic
	auto result = std::find(rec->approvers.begin(), rec->approvers.end(), sender);
	auto result2 = std::find(rec->pic.begin(), rec->pic.end(), sender);
	auto picapproved = is_pic_approved(*rec);
	eosio::print(picapproved, ":", (result != rec->approvers.end()), ":", (result2 != rec->pic.end()));
	eosio_assert_code(
		(result != rec->approvers.end()) || 
		((result2 != rec->pic.end()) && picapproved) , SENDER_NOT_APPROVER);
	// check if task is owned by person
	//eosio_assert_code(rec->owner!=N(""), TASK_OWNED_BY_CIPHER);
	// chkck if task is already approved
	auto result3 = std::find(rec->approve_task.begin(), rec->approve_task.end(), sender);
	// if results is already approved, task can't change
	eosio_assert_code(!is_results_approved(*rec), RESULTS_ALREADY_APPROVED);

	if (vec) { // approve
		// check if sender doesn't approve the task
		eosio_assert_code(result3 == rec->approve_task.end(), SENDER_ALREADY_APPROVE);
	} else { //cancel approval 
		// check if sender approves the task
		eosio_assert_code(result3 != rec->approve_task.end(), SENDER_NOT_APPROVE_YET);
		// if task is fulfill approval requirements, only pic can cancel approval
		if (is_task_approved(*rec)) {
			eosio_assert_code(result2 != rec->pic.end(), TASK_ALREADY_APPROVED);
		}
	}
	d.modify(rec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_task.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_task.begin(), dd.approve_task.end(), sender);
			dd.approve_task.erase(result, dd.approve_task.end());
		}
	});
}

void Task::taaprvpic( const account_name sender, const uint64_t id, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	// check if sender is approver or pic
	auto result = std::find(rec->approvers.begin(), rec->approvers.end(), sender);
	eosio_assert_code((result != rec->approvers.end()) || (sender == rec->owner), SENDER_NOT_APPROVER);
	// check if task is owned by person
	//eosio_assert_code(rec->owner!=N(""), TASK_OWNED_BY_CIPHER);
	// check if pic is already approved
	auto result2 = std::find(rec->approve_pic.begin(), rec->approve_pic.end(), sender);
	// if results is on review process, it can't be canceled approval for pic
	eosio_assert_code(rec->approve_results.size()==0, RESULTS_APPROVED_SOME);
	// if results is already approved, pic can't change
	eosio_assert_code(!is_results_approved(*rec), RESULTS_ALREADY_APPROVED);

	if (vec) { // approve
		// check if pic is not set yet
		eosio_assert_code(rec->pic.size()>0, PIC_NOT_ASSIGNED);
		// sender already approved pic
		eosio_assert_code(result2 == rec->approve_pic.end(), SENDER_ALREADY_APPROVE);
	} else { //cancel approval 
		eosio_assert_code(result2 != rec->approve_pic.end(), SENDER_NOT_APPROVE_YET);
	}
	d.modify(rec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_pic.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_pic.begin(), dd.approve_pic.end(), sender);
			dd.approve_pic.erase(result, dd.approve_pic.end());
			// if pic is canceled approval, an approval for task pic did is canceled
			for (auto it = dd.pic.begin(); it != dd.pic.end(); ++it) {
				auto result2 = std::remove(dd.approve_task.begin(), dd.approve_task.end(), *it);
				dd.approve_task.erase(result2, dd.approve_task.end()); 
			}
		}
		dd.approve_results = vector<account_name>{};
	});
}

void Task::taaprvrslt( const account_name sender, const uint64_t id, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	// check if sender is approver
	auto result = std::find(rec->approvers.begin(), rec->approvers.end(), sender);
	eosio_assert_code(result != rec->approvers.end(), SENDER_NOT_APPROVER);
	// chcek if task fulfills approval requirements
	eosio_assert_code(is_task_approved(*rec), TASK_NOT_APPROVED);
	// check if task is owned by person
	//eosio_assert_code(rec->owner!=N(""), TASK_OWNED_BY_CIPHER);
	// check if results is already approved
	auto result2 = std::find(rec->approve_results.begin(), rec->approve_results.end(), sender);
	// check if pic is approved
	eosio_assert_code(is_pic_approved(*rec), PIC_NOT_APPROVED);

	if (vec) { // approve
		// check if pic is not set yet
		eosio_assert_code(rec->pic.size()>0, PIC_NOT_ASSIGNED);
		// check if sender doesn't approve results
		eosio_assert_code(result2 == rec->approve_results.end(), SENDER_ALREADY_APPROVE);
	} else { //cancel approval 
		// check if sender approves results
		eosio_assert_code(result2 != rec->approve_results.end(), SENDER_NOT_APPROVE_YET);
		// check if already approval requirements for results are already fulfilled
		eosio_assert_code(!is_results_approved(*rec), RESULTS_ALREADY_APPROVED);
	}
	d.modify(rec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_results.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_results.begin(), dd.approve_results.end(), sender);
			dd.approve_results.erase(result, dd.approve_results.end());
		}
	});
	// check if number of approval for results fulfills requirements
	eosio::print("nof_approval_for_results:", rec->approve_results.size(), "\n");
	if (rec->approve_results.size()>=rec->nofauth) {
		// issue token to pic
		if (rec->rewardid!=NUMBER_NULL) {
			// calc quantity
			// TODO:how to deal with surplus
			uint64_t dev = rec->rquantity / rec->pic.size();
			for (auto it=rec->pic.begin(); it!=rec->pic.end(); ++it) {
				eosio::print("issue:", rec->rewardid, ":", dev);
				Token::issue(sender, rec->cipherid, rec->rewardid, *it, dev);
			}
		}
	}
}

void Task::applyforpic( const account_name sender, const uint64_t id, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);

	if (vec) { // apply
		// check if pic is set
		eosio_assert_code(rec->pic.size()==0, PIC_IS_ASSIGNED);
	} else { // cancel application
		// check if pic is sender
		auto result = std::find(rec->pic.begin(), rec->pic.end(), sender);
		eosio_assert_code(result!=rec->pic.end(), PIC_IS_NOT_SENDER);
	}
	// if results is already approved, pic can't change
	eosio_assert_code(!is_results_approved(*rec), RESULTS_ALREADY_APPROVED);

	d.modify(rec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.pic = vector<account_name>{sender};	
		} else { // cancel approval
			// if pic is canceled, an approval for task pic did is canceled
			for (auto it = dd.pic.begin(); it != dd.pic.end(); ++it) {
				auto result2 = std::remove(dd.approve_task.begin(), dd.approve_task.end(), *it);
				dd.approve_task.erase(result2, dd.approve_task.end()); 
			}
			auto result = std::remove(dd.pic.begin(), dd.pic.end(), sender);
			dd.pic.erase(result, dd.pic.end());
		}
		// initialize approval for pic
		dd.approve_pic = vector<account_name>{};
		// initialize approval for results 
		dd.approve_results = vector<account_name>{};
	});
}

bool Task::is_pic_approved(const task& d) {
	for (auto it = d.approvers.begin(); it != d.approvers.end(); ++it) {
		// check if each approver approved the pic 
		auto found = std::find(d.approve_pic.begin(), d.approve_pic.end(), *it);
		if (found==d.approve_pic.end()) return false;
	}
	return true;
}

bool Task::is_task_approved(const task& d) {
	int nofapprover = 0, nofpic = 0;
	for (auto it = d.approve_task.begin(); it != d.approve_task.end(); ++it) {
		// count a person who is approver 
		auto found = std::find(d.approvers.begin(), d.approvers.end(), *it);
		if (found!=d.approvers.end()) nofapprover++;
		// count a person who is in charge of this task 
		auto found2 = std::find(d.pic.begin(), d.pic.end(), *it);
		if (found2!=d.pic.end()) nofpic++;
	}
	return (nofapprover>=d.nofauth) && (nofpic==d.pic.size());
}

bool Task::is_results_approved(const task& d) {
	for (auto it = d.approvers.begin(); it != d.approvers.end(); ++it) {
		// check if each approver approved results 
		auto found = std::find(d.approve_results.begin(), d.approve_results.end(), *it);
		if (found==d.approve_results.end()) return false;
	}
	return true;
}

bool Task::is_results_approved_some(const task& d) {
	for (auto it = d.approvers.begin(); it != d.approvers.end(); ++it) {
		// check if each approver approved results
		auto found = std::find(d.approve_results.begin(), d.approve_results.end(), *it);
		if (found!=d.approve_results.end()) return true;
	}
	return false;
}

void Task::checkdata( const account_name sender,
				const account_name owner, const uint64_t cid,
				const string& name, const uint64_t rewardid, 
				const uint64_t rquantity, const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, const string& hash, 
				const vector<string>& tags) {

	Cipher::data cd(SELF, SELF);
	auto crec = cd.find(cid);
	eosio_assert_code(crec!=cd.end(), CIPHER_NOT_FOUND);

	// check if sender is fulfill the required auth
	require_auth(sender);

	// check if name is set
	eosio_assert_code(name.length()>=NAME_MINLEN, NAME_TOO_SHORT);
	
	// check if approver data is comformable
	eosio_assert_code((size_t)nofauth<=approvers.size(), INVALID_APPROVER);

	// check if approvers is invalid
	eosio_assert_code(Person::checkList(approvers), INVALID_APPROVER);
	
	// check if pic is invalid
	eosio_assert_code(Person::checkList(pic), INVALID_PIC);
	
	// check rewardid
	eosio::print("rewardid", rewardid, ":", eosio::name{owner}, "\n");
	Validator::check_tokenowner(rewardid, owner, crec->cipherid);

	// check cipherid
	Validator::check_cipher(cid);
	
	// check if approver is set
	eosio_assert_code(approvers.size()>0, APPROVER_NOT_SET);

	// check if rquantity is set only in case that rquantity is set
	eosio::print("##", rewardid, "::", rquantity);
	eosio_assert_code(
		(rewardid != NUMBER_NULL && rquantity != NUMBER_NULL) ||
		(rewardid == NUMBER_NULL && rquantity == NUMBER_NULL)
		, INVALID_REWARD);
	
	// check hash
	Validator::check_hash(hash);
}

bool Task::is_shared(const uint64_t taskid, const uint64_t cid) {
	if (cid==NUMBER_NULL) return false;
	Cipher::data d(SELF, SELF);
	auto rec = d.find(cid);
	eosio_assert_code(rec!=d.end(), CIPHER_NOT_FOUND);
	for (auto it=d.begin(); it!=d.end(); ++it) {
		if (it->id==cid) continue;
		auto found = std::find(it->tasklist.begin(), it->tasklist.end(), taskid);
		if (found!=it->tasklist.end()) return true;
	}
	return false;
}

} // mypher