# Superpowers fText plugin

This plugin brings a generic text asset of type `fText` to the `Sup Game` system for [Superpowers, the extensible HTML5 2D+3D game engine](http://sparklinlabs.com).


## Documentation

[http://florentpoujol.github.io/superpowers-ftext-plugin](http://florentpoujol.github.io/superpowers-ftext-plugin)

You can also access it offline in Superpowers' client with the [docs browser](https://github.com/florentpoujol/superpowers-docs-browser-plugin) plugin, or find it directly in the plugin's `public/docs` folder.


## Installation

- [Download the latest release](https://github.com/florentpoujol/superpowers-ftext-plugin/releases),
- unzip it then rename the folder to `ftext`,
- delete the `project` folder if you want,
- move it inside `app/systems/supGame/plugins/florentpoujol/`,
- then restart your server.

__Advanced:__

Get it via `npm`:
		
		cd app/systems/supGame/plugins
    npm install sup-ftext-plugin

The name of the vendors or plugins in the `app/systems/supGame/plugins/` folder don't matter.  
So you can leave the plugin path as `node_modules/sup-ftext-plugin`.


## Test/Demo project

The `project` folder contains a test/demo project.  

To run it, put the project's `fText` folder in Superpowers' projects folder, and (re)start the server.

On Window7, Superpowers' projects folder is typically in `C:\Users\[Your user name]\AppData\Roaming\Superpowers`.
