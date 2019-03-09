// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include <boost/algorithm/string.hpp>
#include "prim.hpp"

namespace mypher {
	const char* Prim::chars = "0123456789abcdef";

	void Prim::itoa16(char *buf, const uint64_t& v) {
		for (int i=0; i<16; i++) {
			buf[i] = chars[(v>>(i<<2)) & (0xf)];
		}
		buf[16] = 0x0;
	}
};
