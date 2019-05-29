// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

#include "mypher.hpp"

EOSIO_DISPATCH( Mypher, 
	(pupdate)
	(cnew)(cnewdraft)(cupdate)(capprove)(crevapprove)
	(tknew)(tkupdate)(tktransfer)(tkuse)(tkreqpay)(tkgetpay)
	(tanew)(taupdate)(taaprvpic)(taaprvrslt)(taaplypic)(taprrslt)(tareqpay)(tafinish)
)
