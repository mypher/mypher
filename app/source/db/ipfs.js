// Copyright (C) 2018-2019 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

let log = require('../cmn/logger')('db.ipfs');
let ipfsApi = require('ipfs-api');

const ipfs = ipfsApi('127.0.0.1', 7100, {protocol: 'http'});

module.exports = {
	add : async data => {
		return new Promise( (resolve, reject) => {
			ipfs.files.add(Buffer.from(JSON.stringify(data), 'utf-8'), (err, res) => {
				if (err) {
					reject(err);
				}
				resolve(res);
			});
		});
	},
	get : async key => {
		return new Promise( (resolve, reject) => {
			ipfs.files.cat(key, (err,file) => {
				if (err) {
					reject(err);
				}
				resolve(JSON.parse(file.toString('utf-8')));
			});
		});
	}
};
