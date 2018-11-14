// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include <boost/range/iterator_range.hpp>
#include "task.hpp"

using namespace eosio;
using namespace std;

namespace mypher {

void Task::tanew(const account_name sender, const uint64_t cipherid, const account_name owner,
				const string& name, const string& description, const uint64_t ruleid, 
				const uint64_t rewardid, const uint64_t rquantity, const vector<account_name>& pic, 
				const bool formal, const vector<string>& tags) {
	require_auth(sender);
	data d(self, self);
	uint64_t id = d.available_primary_key();
	eosio::print("#tanew#", sender, ":", id);
	d.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.cipherid = cipherid;
		dd.owner = owner;
		dd.name = name;
		dd.description = description;
		dd.ruleid = ruleid;
		dd.rewardid = rewardid;
		dd.rquantity = rquantity;
		dd.pic = pic;
		dd.formal = formal;
		dd.tags = tags;
	});
}

void Task::taupdate( const account_name sender, const uint64_t id, const uint64_t cipherid, 
				const account_name owner, const string& name, const string& description, 
				const uint64_t ruleid, const uint64_t rewardid, const uint64_t rquantity, 
				const vector<account_name>& pic, const bool formal, const vector<string>& tags) {
	// check if sender is logined user
	require_auth(sender);
	data d(self, self);
	auto rec = d.find(id);
	// check if data exists
	eosio_assert(rec!=d.end(), "DATA_NOT_FOUND");
	// check if data can edit
	if (rec->owner==N("")) { // cipher
		eosio_assert(false, "NOT IMPLEMENTS YET");
	} else { // individual
		eosio_assert(rec->owner==sender, "NOT_EDITABLE");	
	}
	eosio_assert(rec->pic.size()==0, "PIC_IS_ASSIGNED");
	d.modify(rec, sender, [&](auto& dd){
		dd.cipherid = cipherid;
		dd.owner = owner;
		dd.name = name;
		dd.description = description;
		dd.ruleid = ruleid;
		dd.rewardid = rewardid;
		dd.rquantity = rquantity;
		dd.pic = pic;
		dd.formal = formal;
		dd.tags = tags;
	});

}

} // mypher