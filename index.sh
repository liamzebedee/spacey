#!/usr/bin/env bash
config=~/.spacey
mkdir -p ~/.ssh/.sockets/
if [ ! -e "$config" ]; then
	touch $config
fi

node `npm root`/spaceyz/main.js $@