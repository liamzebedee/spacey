var inquirer = require('inquirer');
var execa = require('execa');
var Q = require('q');
const spawn = require('child_process').spawnSync;

servers = `
liam@chilltech.ciphersink.net
`.split('\n').filter(x => x);

const screenRegex = /(\d+)\.(\S+)\s\((\S+\s\S+\s\S+)\)\s\((\S+)\)/;


if(process.argv[2] == 'new') {
	newScreen()
} else {
	chooseScreen()
}



function parseScreens(output) {
	let screens = [];
	output = output.split('\n');

	let startReadingScreens = false;
	for (var i = 0; i < output.length; i++) {
		let line = output[i];

		if(line.startsWith("There are several suitable screens on:")) {
			startReadingScreens = true;
			continue;
		}

		if(startReadingScreens) {
			try {
				let [ _, pid, name, date, attached ] = screenRegex.exec(line)

				screens.push({
					pid,
					name,
					date,
					attached
				})
			} catch(ex) {}

		}
	}

	return screens;
}

function getServerScreens() {
	return servers.map(server => {
		let sed = "sed 's/^[ \t]*//;s/[ \t]*$//'";

		return execa.shell(`ssh -o ControlMaster=auto -o ControlPath=~/.ssh/.sockets/%r@%h-%p -o ControlPersist=600 -tt ${server} "screen -r | ${sed}"`);
	})
}

function newScreen() {
	inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

	inquirer.prompt({
	  type: 'autocomplete',
	  name: 'server',
	  message: 'Which server shall we connect to?',
	  type: 'list',
	  choices: servers.map(server => { return {
	  	name: `${server}`
	  }})
	})
	.then(answer => {
		let screen = process.argv[3];

		let remoteCommand = `ssh -o ControlMaster=auto -o ControlPath=~/.ssh/.sockets/%r@%h-%p -o ControlPersist=600 -tt ${servers[0]} "screen -S ${screen}"`;

		spawn(remoteCommand, [], {
			stdio: 'inherit',
			shell: true
		});
	})
}

function chooseScreen() {
	Q.allSettled(getServerScreens())
	.then(screenOutputs => {
		let screens = screenOutputs.map(promise => parseScreens(promise.value.stdout)).reduce((pre, cur) => pre.concat(cur));

		inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

		return inquirer.prompt({
		  type: 'autocomplete',
		  name: 'screen',
		  message: 'Open a screen:',
		  type: 'list',
		  choices: screens.map(screen => { return {
		  	name: `${screen.name}`,
		  	value: screen
		  }})
		})
	}).then(answer => {
		try {
			let remoteCommand = `ssh -o ControlMaster=auto -o ControlPath=~/.ssh/.sockets/%r@%h-%p -o ControlPersist=600 -tt ${servers[0]} "screen -r ${answer.screen.pid}"`;

			spawn(remoteCommand, [], {
				stdio: 'inherit',
				shell: true
			});
		} catch(ex) { console.log(ex)}
	});

}


