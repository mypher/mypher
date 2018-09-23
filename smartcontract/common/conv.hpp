// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#ifndef COMMON_CONV_HPP
#define COMMON_CONV_HPP

#include <string>
#include <vector>
#include "type.hpp"

namespace mypher {
	class conv {
	public:
		static void st2vec(const std::string& src, std::vector<std::string>& dst);
	};
};

#endif // COMMON_CONV_HPP