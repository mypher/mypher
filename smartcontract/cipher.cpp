// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include "mypher.hpp"
#include "validator/vcipher.hpp"
#include "common/prim.hpp"

namespace mypher {

using namespace eosio;

uint64_t Cipher::gen_secondary_id(const uint32_t& cipherid, const uint16_t& ver, const uint16_t& draftno) {
	return (uint64_t{cipherid} << 32) | (uint64_t{ver} << 16) | draftno;
}

Cipher::Cipher(account_name _self) {
	self = _self;
}

uint32_t Cipher::getNewCipherId(const data& d) {
	auto idx = d.template get_index<N(secondary_key)>();
	auto it = idx.rbegin();
	if (it==idx.rend()) {
		return 1;
	}
	return it->cipherid + 1;
}

uint16_t Cipher::getNewVersion(const data& d, const uint32_t cipherid) {
	auto idx = d.template get_index<N(secondary_key)>();
	auto lower = idx.lower_bound(uint64_t{cipherid}<<32);
	auto upper = idx.upper_bound(uint64_t{cipherid+1}<<32);
	eosio_assert(lower==idx.end(), "SYSTEM_ERROR");
	auto pre = lower;
	for (auto it=lower; it!=upper; ++it ) {
		pre = it;
	}
	return pre->version + 1;
}

bool Cipher::isVersionFormaled(const data& d, const uint32_t cipherid, const uint16_t ver) {
	auto idx = d.template get_index<N(secondary_key)>();
	auto id64 = uint64_t{cipherid}<<32;
	uint16_t ver2 = ver+1;
	auto lower = idx.lower_bound(id64|uint64_t{ver}<<16);
	auto upper = idx.upper_bound(id64|uint64_t{ver2}<<16);
	eosio_assert(lower==idx.end(), "SYSTEM_ERROR");
	for (auto it=lower; it!=upper; ++it ) {
		if (it->formal) return true;
	}
	return false;
}

uint16_t Cipher::getNewDraftNo(const data& d, const uint32_t cipherid, const uint16_t ver) {
	auto idx = d.template get_index<N(secondary_key)>();
	auto id64 = uint64_t{cipherid}<<32;
	uint16_t ver2 = ver+1;
	auto lower = idx.lower_bound(id64|uint64_t{ver}<<16);
	auto upper = idx.upper_bound(id64|uint64_t{ver2}<<16);
	eosio_assert(lower==idx.end(), "SYSTEM_ERROR");
	auto pre = lower;
	for (auto it=lower; it!=upper; ++it ) {
		pre = it;
	}
	return pre->draftno + 1;
}

void Cipher::cnew(const account_name sender, 
				const std::string& name, const std::vector<account_name>& editors,
				const std::vector<std::string>& tags, std::string& hash, bool formal) {
	require_auth(sender);
	data d(self, self);
	uint64_t id = d.available_primary_key();
	// insert new cipher
	d.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.cipherid = getNewCipherId(d);
		dd.version = 1;
		dd.draftno = 1;
		dd.name = name;
		dd.editors = editors;
		dd.tags = tags;
		dd.hash = hash;
		dd.formal = formal;
	});
}

void Cipher::cdraft(const account_name sender, uint32_t cipherid, uint16_t version, uint16_t draftno, 
			const std::string& name, const std::vector<account_name>& editors,
			const std::vector<std::string>& tags, std::string& hash, bool formal) {

	// check if sender is logined user
	require_auth(sender);
	
	data d(self, self);
	auto idx = d.template get_index<N(secondary_key)>();
	// check if data is registered
	auto key = Cipher::gen_secondary_id(cipherid, version, draftno);
	auto rec = idx.find(key);
	if (rec!=idx.end()) {
		auto key2 = Cipher::gen_secondary_id(rec->cipherid, rec->version, rec->draftno);
		eosio_assert(key==key2, "ALREADY_REGISTERD");
	}
	// check if pervious version is formaled
	eosio_assert(!isVersionFormaled(d, cipherid, version), "NOT_VALID_VERSION");
	// check id current version is not formaled
	eosio_assert(isVersionFormaled(d, cipherid, version), "NOT_VALID_VERSION");
	uint64_t id = d.available_primary_key();
	// insert new draft
	d.emplace(sender, [&](auto& dd) {
		dd.id = id;
		dd.cipherid = cipherid;
		dd.version = version;
		dd.draftno = draftno;
		dd.name = name;
		dd.editors = editors;
		dd.tags = tags;
		dd.hash = hash;
		dd.formal = formal;
	});
}

void Cipher::cupdate(const account_name sender, uint32_t cipherid, uint16_t version, uint16_t draftno, 
			const std::string& name, const std::vector<account_name>& editors,
			const std::vector<std::string>& tags, std::string& hash, bool formal) {

	// check if sender is logined user
	require_auth(sender);
	// check if version is already formaled
	data d(self, self);
	eosio_assert(isVersionFormaled(d, cipherid, version), "ALREADY_FORMALED");
	auto idx = d.template get_index<N(secondary_key)>();
	// check if data is registered
	auto key = Cipher::gen_secondary_id(cipherid, version, draftno);
	auto rec = idx.find(key);
	auto test = d.find(rec->id);
	if (rec!=idx.end()) {
		auto key2 = Cipher::gen_secondary_id(rec->cipherid, rec->version, rec->draftno);
		if (key==key2) {
			// check if sender can edit this draft
			eosio_assert(canEdit(sender, rec->editors), "SENDER_CANT_EDIT");
			// update data
			d.modify(test, sender, [&](auto& dd) {
				dd.name = name;
				dd.editors = editors;
				dd.tags = tags;
				dd.hash = hash;
				dd.formal = formal;
			});
		}
	}
	eosio_assert(true, "DATA_NOT_FOUND");
}

bool Cipher::canEdit(const account_name& sender, const std::vector<account_name>& editors) {

	for (auto it = editors.begin(); it != editors.end(); ++it ) {
		if (sender==*it) return true;
	}
	return false;	
}

}