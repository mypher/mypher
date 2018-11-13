// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include <boost/range/iterator_range.hpp>
#include "mypher.hpp"
#include "common/prim.hpp"

namespace mypher {

using namespace eosio;

uint64_t Cipher::gen_secondary_key(const uint32_t& cipherid, const uint16_t& ver, const uint16_t& draftno) {
	uint64_t ret = (uint64_t{cipherid} << 24) | (uint64_t{ver} << 12) | draftno;
	eosio::print("###cipherid:", cipherid, " version:", uint64_t{ver}, " draftno:", uint64_t{draftno}, "=>", ret, "\n");
	return ret;
}

std::string Cipher::gen_third_key(const bool& formal, const std::string& name) {
	return (formal ? "0" : "1") + name;
}

uint32_t Cipher::getNewCipherId(const data& d) {
	auto idx = d.get_index<N(secondary_key)>();
	auto it = idx.rbegin();
	if (it==idx.rend()) {
		return 1;
	}
	return it->cipherid + 1;
}

uint16_t Cipher::getNewVersion(const data& d, const uint32_t cipherid) {
	auto idx = d.get_index<N(secondary_key)>();
	auto lower = idx.lower_bound(gen_secondary_key(cipherid, 1, 1));
	auto upper = idx.upper_bound(gen_secondary_key(cipherid+1, 1, 1));
	eosio_assert(lower!=idx.end(), "SYSTEM_ERROR");
	auto pre = lower;
	bool formaled = false;
	for (auto it=lower; it!=upper; ++it ) {
		if (pre->version!=it->version) {
			formaled = false;
		}
		if (it->formal==true) {
			formaled = true;
		}
		pre = it;
	}
	return pre->version + (formaled ? 1 : 0 );
}

bool Cipher::isVersionFormal(const data& d, const uint32_t cipherid, const uint16_t ver) {
	auto idx = d.get_index<N(secondary_key)>();
	auto lower = idx.lower_bound(gen_secondary_key(cipherid, ver, 1));
	auto upper = idx.upper_bound(gen_secondary_key(cipherid, ver+1, 1));
	eosio_assert(lower!=idx.end(), "SYSTEM_ERROR");
	for (auto it=lower; it!=upper; ++it ) {
		if (it->formal) return true;
	}
	return false;
}

uint16_t Cipher::getNewDraftNo(const data& d, const uint32_t cipherid, const uint16_t ver) {
	auto idx = d.get_index<N(secondary_key)>();
	auto lower = idx.lower_bound(gen_secondary_key(cipherid, ver, 1));
	auto upper = idx.upper_bound(gen_secondary_key(cipherid, ver+1, 1));
	if (lower!=idx.end()) {
		auto pre = lower;
		for (auto it=lower; it!=upper; ++it ) {
			pre = it;
		}
		return pre->draftno + 1;
	}
	return 1;
}

void Cipher::cnew(const account_name sender, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, const std::string& hash,
				uint16_t drule_req, const std::vector<account_name>& drule_auth) {
	require_auth(sender);
	data d(self, self);
	uint64_t id = d.available_primary_key();
	auto cipherid = getNewCipherId(d);
	// insert new cipher
	eosio::print("###", sender, ":", cipherid);
	d.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.cipherid = cipherid;
		dd.version = 1;
		dd.draftno = 1;
		dd.editors = editors;
		dd.hash = hash;
		dd.drule_req = drule_req;
		dd.drule_auth = drule_auth;
		dd.formal = true;
	});
	// insert key data
	keydata d2(self, self);
	d2.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.name = name;
		dd.tags = tags;
		dd.formal = true;
	});
}

void Cipher::ccopy(const account_name sender, const uint64_t id) {
	require_auth(sender);
	data d(self, self);
	uint64_t newid = d.available_primary_key();
	auto rec = d.find(id);
	auto version = getNewVersion(d, rec->cipherid);
	auto draftno = getNewDraftNo(d, rec->cipherid, version);
	std::vector<account_name> editors;

	eosio::print("##Ciher.copy:", rec->cipherid, (uint64_t)version, (uint64_t)draftno);
	
	editors.push_back(sender);
	// insert new draft
	d.emplace(sender, [&](auto& dd) {
		dd.id = newid;
		dd.cipherid = rec->cipherid;
		dd.version = version;
		dd.draftno = draftno;
		dd.editors = editors;
		dd.hash = rec->hash;
		dd.drule_req = rec->drule_req;
		dd.drule_auth = rec->drule_auth;
		dd.formal = false;
	});
	// insert key data
	keydata d2(self, self);
	auto rec2 = d2.find(id);
	d2.emplace(sender, [&](auto& dd) {
		dd.id = newid;
		dd.name = rec2->name;
		dd.tags = rec2->tags;
		dd.formal = false;
	});
	
}

void Cipher::cdraft(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, const std::string& hash,
				uint16_t drule_req, const std::vector<account_name>& drule_auth) {

	// check if sender is logined user
	require_auth(sender);
	
	data d(self, self);
	auto idx = d.get_index<N(secondary_key)>();
	// check if data is registered
	auto key = Cipher::gen_secondary_key(cipherid, version, draftno);
	auto rec = idx.find(key);
	eosio_assert(rec!=idx.end(), "ALREADY_REGISTERED");
	// check if pervious version is formal
	eosio_assert(!isVersionFormal(d, cipherid, version), "NOT_VALID_VERSION");
	// check id current version is not formal
	eosio_assert(isVersionFormal(d, cipherid, version), "NOT_VALID_VERSION");
	uint64_t id = d.available_primary_key();
	// insert new draft
	d.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.cipherid = cipherid;
		dd.version = version;
		dd.draftno = draftno;
		dd.editors = editors;
		dd.hash = hash;
		dd.drule_req = drule_req;
		dd.drule_auth = drule_auth;
		dd.formal = false;
	});
	// insert key data
	keydata d2(self, self);
	d2.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.name = name;
		dd.tags = tags;
		dd.formal = false;
	});
}

void Cipher::cupdate(const account_name sender, 
				uint64_t id,
				uint32_t cipherid, uint16_t version, uint16_t draftno, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, const std::string& hash,
				uint16_t drule_req, const std::vector<account_name>& drule_auth) {

	// check if sender is logined user
	require_auth(sender);
	// check if version is already formal
	data d(self, self);
	eosio_assert(!isVersionFormal(d, cipherid, version), "ALREADY_FORMAL");
	auto rec = d.find(id);
	if (rec!=d.end()) {
		eosio_assert((
			cipherid==rec->cipherid &&
			version==rec->version && 
			draftno==rec->draftno ), "INVALID_PARAM");
		// check if sender can edit this draft
		eosio_assert(canEdit(sender, rec->editors), "SENDER_CANT_EDIT");
		// update data
		d.modify(rec, sender, [&](auto& dd) {
			dd.editors = editors;
			dd.hash = hash;
			dd.drule_req = drule_req;
			dd.drule_auth = drule_auth;
			dd.formal = false;
			dd.approved.clear();
		});
		// update tag data
		keydata d2(self, self);
		auto target2 = d2.find(id);
		d2.modify(target2, sender, [&](auto& dd) {
			dd.name = name;
			dd.tags = tags;
			dd.formal = false;
		});
	}
	eosio_assert(false, "DATA_NOT_FOUND");
}

void Cipher::capprove(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno) {
	// check if sender is logined user
	require_auth(sender);
	data d(self, self);
	auto idx = d.get_index<N(secondary_key)>();
	// check if data is registered
	auto key = Cipher::gen_secondary_key(cipherid, version, draftno);
	auto rec = idx.find(key);
	auto target = d.find(rec->id);
	// check if the draft is exists
	eosio_assert(rec==idx.end(), "NOT_FOUND");
	// check if the version is formal
	eosio_assert(isVersionFormal(d,cipherid, version), "ALREADY_BEEN_FORMAL");
	// check if sender is contained in approver
	auto found = std::find(std::begin(rec->drule_auth), std::end(rec->drule_auth), sender);
	eosio_assert(found==std::end(rec->drule_auth), "SENDER_IS_NOT_APPROVER");
	// check if sender already approved
	found = std::find(std::begin(rec->approved), std::end(rec->approved), sender);
	eosio_assert(found!=std::end(rec->approved), "SENDER_ALREADY_APPROVED"); 
	// update data
	bool formal = false;
	d.modify(target, sender, [&](auto& dd) {
		dd.approved.push_back(sender);
		// if fulfilled the requirement, draft become formal
		if (dd.approved.size()==dd.drule_req) {
			dd.formal = true;
			formal = true;
		}
	});
	// update tag data
	if (formal) {
		keydata d2(self, self);
		auto target2 = d2.find(rec->id);
		d2.modify(target2, sender, [&](auto& dd) {
			dd.formal = true;
		});
	}
}

void Cipher::crevapprove(const account_name sender, 
				uint32_t cipherid, uint16_t version, uint16_t draftno) {
	// check if sender is logined user
	require_auth(sender);
	data d(self, self);
	auto idx = d.get_index<N(secondary_key)>();
	// check if data is registered
	auto key = Cipher::gen_secondary_key(cipherid, version, draftno);
	auto rec = idx.find(key);
	auto target = d.find(rec->id);
	// check if the draft is exists
	eosio_assert(rec==idx.end(), "NOT_FOUND");
	// check if the version is formal
	eosio_assert(isVersionFormal(d,cipherid, version), "ALREADY_BEEN_FORMAL");
	// check if sender is contained in approver
	auto found = std::find(std::begin(rec->drule_auth), std::end(rec->drule_auth), sender);
	eosio_assert(found==std::end(rec->drule_auth), "SENDER_IS_NOT_APPROVER");
	// check if sender doesn't approve yet
	found = std::find(std::begin(rec->approved), std::end(rec->approved), sender);
	eosio_assert(found==std::end(rec->approved), "SENDER_NOT_APPROVE_YET"); 
	// update data
	d.modify(target, sender, [&](auto& dd) {
		std::remove(dd.approved.begin(), dd.approved.end(), sender);
	});
}

bool Cipher::canEdit(const account_name& sender, const std::vector<account_name>& editors) {

	for (auto it = editors.begin(); it != editors.end(); ++it ) {
		if (sender==*it) return true;
	}
	return false;	
}

}