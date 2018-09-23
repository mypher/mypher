// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/eosio.hpp>
#include "vcipher.hpp"
#include "vcommon.hpp"
#include "../common/messageid.h"
#include "../person.hpp"

namespace mypher {
using namespace eosio;

const size_t vcipher::MINLEN_NAME = 1;
const size_t vcipher::MAXLEN_NAME = 200;

const char* vcipher::create(const account_name& self, const std::string& sender, const std::string& name, 
					   const std::string& purpose, const uint16_t& drule_req, 
					   const std::vector<std::string>& drule_auth, 
					   const std::vector<std::string>& editor) {
	if (!vcommon::chkLen(name, MINLEN_NAME, MAXLEN_NAME)) {
		return MES_INVALID_PARAM;
	}
	if (drule_auth.size()<drule_req) {
		return MES_INVALID_PARAM;
	}
	if (!vcommon::chkMember(self, drule_auth)) {
		return MES_INVALID_PARAM;
	}
	return NULL;
}

}