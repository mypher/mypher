// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "conv.hpp"
#include <boost/algorithm/string.hpp>

namespace mypher {
	void conv::st2vec(const std::string& src, std::vector<std::string>& dst) {
		boost::split(dst, src, boost::is_any_of("¥t"));
	}
};