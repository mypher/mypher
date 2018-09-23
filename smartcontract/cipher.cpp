// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <eosiolib/print.hpp>
#include "mypher.hpp"
#include "validator/vcipher.hpp"
#include "common/conv.hpp"

namespace mypher {

using namespace eosio;	

void Cipher::ccreate(const string& sender, const string& name, const string& purpose,
				const uint16_t& drule_req, const string& drule_auth, const string& editor) {
	print("cprint", self);
	const char* ret;
	std:vector<std::string> vecAuth, vecEditor;
	// convert string to vector
	conv::st2vec(drule_auth, vecAuth);
	conv::st2vec(editor, vecEditor);
	// validate parameters
	ret = vcipher::create(self, sender, name, purpose, drule_req, vecAuth, vecEditor);
	eosio_assert(ret!=NULL, ret);
}

}