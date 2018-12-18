// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const { execSync } = require('child_process');

module.exports = {
	initDocker : async () => {
		const command = [
			'docker run --rm ',
			'--name mypher_test1 ',
			'-p 8888:8888 ',
			'-p 8800:8800 ',
			'-p 9876:9876 ',
			'-p 7000:7000 ',
			'-p 7100:7100 ',
			'-v ../../docker/contracts:/contracts ',
			'-v ../../docker/scripts:/scripts ',
			'-v ../../app:/app ',
			'mypher_test ',
			'/bin/bash -c "/scripts/start.sh"'
		].join('');
		execSync(command);
	}
};
