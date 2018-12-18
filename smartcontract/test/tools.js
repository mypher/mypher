// Copyright (C) 2018 The Mypher Authors
//
// SPDX-License-Identifier: LGPL-3.0+
//

'use_strict'

const { execSync } = require('child_process');
const path = require('path');

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
			'-v ' + path.join(__dirname, '../../docker/contracts') + ':/contracts ',
			'-v ' + path.join(__dirname, '../../docker/scripts') + ':/scripts ',
			'-v ' + path.join(__dirname, '../../app') + ':/app ',
			'mypher_test ',
			'/bin/bash -c "/scripts/start.sh" &'
		].join('');
		console.log(command);
		execSync(command);
		sleep(100000);
	}
};
