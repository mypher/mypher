if (process.argv.length!==3) {
	process.stderr.write('invalid params');
	process.exit(-1);
}
try {
	const execSync = require('child_process').execSync;
	let cmd = 'curl -H \'Content-Type:application/json\' -d \'{"jsonrpc":"2.0","id":1,"method":"system.get_ipfs","params":[{}]}\' ' + process.argv[2];
	let result = execSync(cmd).toString();
	console.log(result);
	result = JSON.parse(result);
	result.result.forEach(elm=> {
		execSync('ipfs bootstrap add ' + elm);
	});
} catch (e) {
	process.stderr.write(e);
	process.exit(-1);
}
