#!/usr/bin/env bash
config=~/.spacey
if [ ! -e "$config" ]; then
	touch $config
fi

node main.js $@