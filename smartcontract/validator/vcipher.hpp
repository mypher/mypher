// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef VCIPHER_H
#define VCIPHER_H

#include <string>
#include <vector>

namespace mypher {

class vcipher {
private:
	static const size_t MINLEN_NAME;
	static const size_t MAXLEN_NAME;

public:
	static const char* create(const account_name& self, const std::string& sender, const std::string& name, 
					   const std::string& purpose, const uint16_t& drule_req, 
					   const std::vector<std::string>& drule_auth, 
					   const std::vector<std::string>& editor);
};

}

#endif // VCIPHER_H