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
				const vector<account_name>& authorizors, 
				const vector<account_name>& pic, 
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

	// check if authorizor data is comformable
	eosio_assert_code((size_t)nofauth<=authorizors.size(), INVALID_AUTHORIZORS);

	// check if authorizors is invalid
	eosio_assert_code(Person::checkList(authorizors), INVALID_AUTHORIZORS);

	// check if pic is invalid
	eosio_assert_code(Person::checkList(pic), INVALID_PIC);

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
		dd.authorizors = authorizors;
		dd.pic = pic;
		dd.tags = tags;
	});
}

void Task::taupdate( const account_name sender, const uint64_t id, const string& name,  
				const uint64_t rewardid, const uint64_t rquantity, 
				const uint8_t nofauth, 
				const vector<account_name>& authorizors, 
				const vector<account_name>& pic, const vector<string>& tags) {
	// check if sender is fulfill the required auth
	require_auth(sender);

	// check if name is set
	eosio_assert_code(name.length()>=NAME_MINLEN, NAME_TOO_SHORT);
	
	// check if authorizor data is comformable
	eosio_assert_code((size_t)nofauth<=authorizors.size(), INVALID_AUTHORIZORS);

	// check if authorizors is invalid
	eosio_assert_code(Person::checkList(authorizors), INVALID_AUTHORIZORS);

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
	} else {
		int n = (int)rec->nofauth;
		for (auto it = rec->authorizors.begin(); it != rec->authorizors.end(); ++it) {
			auto result = std::find(rec->auth_task.begin(), rec->auth_task.end(), *it);
			if (result != rec->auth_task.end()) n--;
		}
		eosio_assert_code(n>0, ALREADY_FORMAL);
	}
	eosio_assert_code(rec->pic.size()==0, PIC_IS_ASSIGNED);
	d.modify(rec, sender, [&](auto& dd){
		dd.name = name;
		dd.rewardid = rewardid;
		dd.rquantity = rquantity;
		dd.nofauth = nofauth;
		dd.authorizors = authorizors;
		dd.pic = pic;
		dd.tags = tags;
	});

}

} // mypher