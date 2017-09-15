spacey
======

[![npm version](https://badge.fury.io/js/spaceyz@2x.png)](https://badge.fury.io/js/spaceyz)

spacey makes it easier to just manage screens on remote servers.
 - automatically lists screens from any SSH-enabled server
 - smart ssh quickconnect w/ ControlPath

Commands:
 - `spacey` lists screens
 - `spacey new <name>` creates a new screen (with prompt for which server)

![Demo GIF](demo.gif)

GPL v3 - Liam Edwards-Playne / @liamzebedee. <3 

# Install
```
# Install
npm i -G spaceyz

# Setup your servers
echo "liam@something.com" > ~/.spacey

# Run spacey
spacey
```

## Troubleshooting
`DEBUG=spacey spacey` prints debug information. The source is very simple, take a look.