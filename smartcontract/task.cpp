// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include <boost/range/iterator_range.hpp>
#include "task.hpp"
#include "cipher.hpp"
#include "person.hpp"

using namespace eosio;
using namespace std;

namespace mypher {

void Task::tanew(const account_name sender, const uint64_t cipherid, 
				const string& name, const uint64_t rewardid, const uint64_t rquantity, 
				const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, 
				const string& hash,
				const vector<string>& tags) {
	// check if sender is fulfill the required auth
	require_auth(sender);

	// check if cipherid is exists
	account_name owner = N("");
	if (cipherid!=NUMBER_NULL) {
		eosio_assert_code(Cipher::isCipherExists(cipherid), CIPHER_NOT_FOUND);
	} else {
		owner = sender;
	}
	
	// check if name is set
	eosio_assert_code(name.length()>=NAME_MINLEN, NAME_TOO_SHORT);

	// check if approver data is comformable
	eosio_assert_code((size_t)nofauth<=approvers.size(), INVALID_APPROVER);

	// check if approvers is invalid
	eosio_assert_code(Person::checkList(approvers), INVALID_APPROVER);

	// check if pic is invalid
	eosio_assert_code(Person::checkList(pic), INVALID_PIC);

	// TODO:check if hash is correct

	data d(self, self);
	uint64_t id = d.available_primary_key();
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
}

void Task::taupdate( const account_name sender, const uint64_t id, const string& name,  
				const uint64_t rewardid, const uint64_t rquantity, 
				const uint8_t nofauth, 
				const vector<account_name>& approvers, 
				const vector<account_name>& pic, 
				const string& hash,
				const vector<string>& tags) {
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

	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	// check if task is already formal
	if (rec->cipherid!=NUMBER_NULL) {
		Cipher::data d2(self, self);
		auto rec2 = d2.find(rec->cipherid);
		eosio_assert_code(rec2!=d2.end(), CIPHER_NOT_FOUND);
		eosio_assert_code(!rec2->formal, ALREADY_FORMAL);
	}
	// check if pic is approved
	eosio_assert_code(!ispicapproved(*rec), PIC_ALREADY_APPROVED);

	// TODO: check if hash is correct

	d.modify(rec, sender, [&](auto& dd){
		dd.name = name;
		dd.rewardid = rewardid;
		dd.rquantity = rquantity;
		dd.nofauth = nofauth;
		dd.approvers = approvers;
		dd.pic = pic;
		dd.hash = hash;
		dd.tags = tags;
		dd.approve_task = vector<account_name>{};
		// remove pic from approve_pic
		for (auto it = pic.begin(); it != pic.end(); ++it ) {
			auto result = std::remove(dd.approve_pic.begin(), dd.approve_pic.end(), *it);
			dd.approve_pic.erase(result, dd.approve_pic.end());
		}
	});
}

void Task::taaprvtask( const account_name sender, const uint64_t id, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);
	// check if sender is approver
	auto result = std::find(rec->approvers.begin(), rec->approvers.end(), sender);
	eosio_assert_code(result != rec->approvers.end(), NOT_FOUND);
	// check if task is owned by person
	eosio_assert_code(rec->owner!=N(""), TASK_OWNED_BY_CIPHER);
	// chkck if task is already approved
	auto result2 = std::find(rec->approve_task.begin(), rec->approve_task.end(), sender);

	if (vec) { // approve
		eosio_assert_code(result == rec->approve_task.end(), SENDER_ALREADY_APPROVED);
	} else { //cancel approval 
		eosio_assert_code(result != rec->approve_task.end(), SENDER_NOT_APPROVE_YET);
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
	eosio_assert_code((result != rec->approvers.end()) || (sender == rec->owner), NOT_FOUND);
	// check if task is owned by person
	eosio_assert_code(rec->owner!=N(""), TASK_OWNED_BY_CIPHER);
	// chkck if pic is already approved
	auto result2 = std::find(rec->approve_pic.begin(), rec->approve_pic.end(), sender);

	if (vec) { // approve
		eosio_assert_code(result == rec->approve_pic.end(), SENDER_ALREADY_APPROVED);
	} else { //cancel approval 
		eosio_assert_code(result != rec->approve_pic.end(), SENDER_NOT_APPROVE_YET);
	}
	d.modify(rec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_pic.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_pic.begin(), dd.approve_pic.end(), sender);
			dd.approve_pic.erase(result, dd.approve_pic.end());
		}
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
	eosio_assert_code(result != rec->approvers.end(), NOT_FOUND);
	// check if task is owned by person
	eosio_assert_code(rec->owner!=N(""), TASK_OWNED_BY_CIPHER);
	// chkck if results is already approved
	auto result2 = std::find(rec->approve_results.begin(), rec->approve_results.end(), sender);

	if (vec) { // approve
		eosio_assert_code(result == rec->approve_results.end(), SENDER_ALREADY_APPROVED);
	} else { //cancel approval 
		eosio_assert_code(result != rec->approve_results.end(), SENDER_NOT_APPROVE_YET);
	}
	d.modify(rec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.approve_results.push_back(sender);
		} else { // cancel approval
			auto result = std::remove(dd.approve_results.begin(), dd.approve_results.end(), sender);
			dd.approve_results.erase(result, dd.approve_results.end());
		}
	});
}

void Task::applyforpic( const account_name sender, const uint64_t id, const bool vec) {
	// check if sender is fulfill the required auth
	require_auth(sender);
	
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert_code(rec!=d.end(), NOT_FOUND);

	if (vec) { // apply
		//check if pic is set
		eosio_assert_code(rec->pic.size()>0, PIC_IS_ASSIGNED);
	} else { // cancel application
		// check if pic is sender
		auto result = std::find(rec->pic.begin(), rec->pic.end(), sender);
		eosio_assert_code(result!=rec->pic.end(), PIC_IS_NOT_SENDER);
	}

	d.modify(rec, sender, [&](auto& dd){
		if (vec) { // approve
			dd.pic = vector<account_name>{sender};	
		} else { // cancel approval
			auto result = std::remove(dd.pic.begin(), dd.pic.end(), sender);
			dd.pic.erase(result, dd.pic.end());
		}
		dd.approve_pic = vector<account_name>{};
	});
}

bool Task::ispicapproved(const task& d) {
	// check if required number of approvers is fulfilled
	int req = (int)d.nofauth;
	for (auto it = d.approvers.begin(); it != d.approvers.end(); ++it) {
		auto found = std::find(d.approve_pic.begin(), d.approve_pic.end(), *it);
		if (found!=d.approve_pic.end()) req--;
	}
	if (req>0) return false;
	// check if all pic appprove
	for (auto it = d.pic.begin(); it != d.pic.end(); ++it) {
		auto found = std::find(d.approve_pic.begin(), d.approve_pic.end(), *it);
		if (found==d.approve_pic.end()) return false;
	}
	return true;
}



} // mypher