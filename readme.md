# Superpowers fText plugin

This plugin brings a generic text asset of type `fText` to [Superpowers, the extensible HTML5 2D+3D game engine](http://sparklinlabs.com).

## Documentation

[http://florentpoujol.github.io/superpowers-ftext-plugin](http://florentpoujol.github.io/superpowers-ftext-plugin)

You can also access it offline in Superpowers' client with the [docs browser](https://github.com/florentpoujol/superpowers-docs-browser-plugin) plugin, or find it directly in the plugin's `public/docs` folder.

## Installation

- [Download the latest release](https://github.com/florentpoujol/superpowers-ftext-plugin/releases),
- unzip it then rename the folder to `ftext`,
- delete the `project` folder if you want,
- move it inside `app/plugins/florentpoujol/`,
- then restart your server.

## Test/Demo project

The `project` folder contains a test/demo project.  

To run it, put the project's `fText` folder in Superpowers' projects folder, and (re)start the server.

On Window7, Superpowers' projects folder is typically in `C:\Users\[Your user name]\AppData\Roaming\Superpowers`.

## Branches on Github

The `master` branch (and the release Zips) contains only the files strictly necessary for the plugin to work in Superpowers, plus the demo project in the `project` folder.

The `dev` branch contains all the files necessary for the development, minus the one that can be get or generated with the `npm install`, `gulp typescript` then `gulp` commands.
