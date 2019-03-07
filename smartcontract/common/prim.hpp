// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef COMMON_PRIM_HPP
#define COMMON_PRIM_HPP

#include <string>
#include <vector>
#include "type.hpp"

namespace mypher {
	class Prim {
	private:
		static const char* chars;  
	public:
		static void itoa16(char *buf, const uint64_t& v);
		static void itoad(char *buf, const uint64_t& v);
	};
};

#endif // COMMON_PRIM_HPP
