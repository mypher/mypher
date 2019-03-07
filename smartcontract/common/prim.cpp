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

	void Prim::itoad(char *buf, const uint64_t& v) {
		int i = 0;
		int n1 = v;
		bool padded = false;
		while(n1!=0)
		{
			buf[i++] = n1%10+'0';
			n1=n1/10;
			if (i==4) {
				buf[i++] = '.';
			}
		}
		while(i<4) {
			buf[i++] = '0';
		}
		if (i==4) {
			buf[i++] = '.';
			buf[i++] = '0';
		}
		buf[i] = '\0';
		for(int t = 0; t < i/2; t++)
		{
			buf[t] ^= buf[i-t-1];
			buf[i-t-1] ^= buf[t];
			buf[t] ^= buf[i-t-1];
		}
	}
};
