'use strict';
const inquirer = require('inquirer');
const execa = require('execa');
const Q = require('q');
const spawn = require('child_process').spawn;
const stringArgv = require('string-argv');
const EventEmitter = require('events');
const debug = require('debug')('spacey')  
const fs = require('fs')
const path = require('path');


var servers = [];

(function readConfig() {
	const CONFIG_PATH = `${process.env.HOME}/.spacey`;
	let data = fs.readFileSync(CONFIG_PATH, 'utf8');
	servers = data.split('\n').filter(x => x);
	debug(`Loaded servers from ~/.spacey:\n${servers}`)
})()


function connectSSH(host, cmd, interactive=false) {
	let argv = stringArgv(`ssh ${host} -o ControlMaster=auto -o ControlPath=~/.ssh/.sockets/%r@%h-%p -o ControlPersist=600 -tt "${cmd}"`);

	let dfd = Q.defer();
	
	execa(argv[0], argv.slice(1), {
		shell: true,
		stdio: interactive ? 'inherit' : null
	}).then(promise => {
		dfd.resolve({
			output: promise.stdout,
			server: host
		})
	}).catch(ex => console.error(ex))
	
	return dfd.promise;
}


if(process.argv[2] == 'new') {
	newScreen()
} else {
	chooseScreen()
}

// Full format
// const SCREEN_REGEX = /(\d+)\.(\S+)\s\((\S+\s\S+\s\S+)\)\s\((\S+)\)/;
// Loose format
const SCREEN_REGEX = /(\d+)\.(\S+)\s\((\S+(\s){0,1}\S+(\s){0,1}\S+)\)/;

function parseScreens(serverScreen) {
	let screens = [];
	try {
		let server = serverScreen.server;
		let output = serverScreen.output.split('\n');

		let startReadingScreens = false;
		for (var i = 0; i < output.length; i++) {
			let line = output[i];

			if(line.startsWith("There are several suitable screens on:")) {
				startReadingScreens = true;
				continue;
			}

			if(startReadingScreens) {
				let [ _, pid, name, _2, _3 ] = SCREEN_REGEX.exec(line)

				screens.push({
					server,
					pid,
					name,
					fullname: `${pid}.${name}`,
					// date,
					// attached
				})
			}
		}
	} catch(ex) {

	}
	
	return screens;
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
		connectSSH(answer.server, `screen -S ${screen}`, true)
	})
}

function getServerScreens() {
	const sed = "sed 's/^[ \t]*//;s/[ \t]*$//'";
	return servers.map(server => {
		return connectSSH(server, `screen -r | ${sed}`, false)
	})
}


function chooseScreen() {
	Q.allSettled(getServerScreens())
	.then(serverScreens => {
		let screens = [];
		screens = serverScreens.map(promise => parseScreens(promise.value)).reduce((pre, cur) => pre.concat(cur));

		debug(`Found screens:\n ${JSON.stringify(screens, null, 1)}`);

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
			connectSSH(answer.screen.server, `screen -r ${answer.screen.fullname}`, true)
		} catch(ex) { console.log(ex)}
	});
}


