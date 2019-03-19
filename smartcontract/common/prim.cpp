// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "prim.hpp"

const char* Prim::chars = "0123456789abcdef";

void Prim::itoa16(char *buf, const uint64_t& v) {
	for (int i=0; i<16; i++) {
		buf[i] = chars[(v>>(i<<2)) & (0xf)];
	}
	buf[16] = 0x0;
}


uint64_t Prim::gen_secondary_key(const uint16_t& ver, const uint16_t& no) {
	uint64_t ret = (uint64_t{ver} << 16) | no;
	return ret;
}
