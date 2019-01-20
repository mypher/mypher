// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log4js = require('log4js');
let allconf = require('config');

log4js.configure(allconf.Logger);

module.exports = (name => {
    return log4js.getLogger(name);
    //error: log4js.getLogger('error')
});
