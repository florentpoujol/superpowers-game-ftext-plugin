# Superpowers Game fText plugin

This plugin brings a generic text asset of type `fText` to the `Superpowers Game` system for [Superpowers, the extensible HTML5 2D+3D game engine](http://superpowers-html5.com).


## Installation

- [Download the latest release](https://github.com/florentpoujol/superpowers-game-ftext-plugin/releases),
- unzip it then rename the folder to `fText`,
- delete the `project` folder if you want,
- move it inside `core/systems/game/plugins/florentpoujol/`,
- then restart your server.


## Creating a new asset

When creating a new asset in Superpowers' client, select the `fText` type.

## Editor features and settings

The editor's theme, tab size and some other settings can be set through the "Text Editor" settings.

fText introduce some other settings :

<table>
  <tr>
    <th>Setting</th>
    <th>Action / Effect</th>
  </tr>
  <tr>
    <td>Auto close brackets</td>
    <td>Automatically add the closing character when writing the following characters <code>{ ( [ " '</code></td>
  </tr>
  <tr>
    <td>Highlight</td>
    <td>
      - active line: Makes the current line stand out.<br>
      - trailing spaces: in red.<br>
      - matching tags: in languages that have pairs of tags -like HTML- having the mouse cursor over one will highlight the other one. <br>Pressing <code>Ctrl/Cmd+J</code> will jump to the matching tag.<br>
      - matching words: when a word is selected, this highlight all other occurrences in the document.
    </td>
  </tr>
  <tr>
    <td>Linting</td>
    <td>Enable/disable linting of the syntaxes (not all syntaxes can be linted)</td>
  </tr>
</table>


## Syntactic coloration and linting

The syntactic coloration and linting kicks in when the asset's extension is recognized.

The asset's extension can be any of CodeMirror's loaded modes or MIME type, some having standard short version.

Supported modes and extensions are :

<table>
  <tr>
    <th>Mode</th>
    <th>Short extension</th>
    <th>is linted</th>
  </tr>
  <tr>
    <td>javascript</td>
    <td>js <br> 
    json (application/json MIME type)</td>
    <td>yes</td>
  </tr>
  <tr>
    <td>coffeescript</td>
    <td>cson</td>
    <td>yes</td>
  </tr>
  <tr>
    <td>yaml</td>
    <td>yml</td>
    <td>yes</td>
  </tr>
  <tr>
    <td>xml</td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td>htmlmixed</td>
    <td>html</td>
    <td></td>
  </tr>
  <tr>
    <td>pug</td>
    <td></td>
    <td>yes</td>
  </tr>
  <tr>
    <td>css</td>
    <td></td>
    <td>yes</td>
  </tr>
  <tr>
    <td>stylus</td>
    <td>styl</td>
    <td>yes</td>
  </tr>
  <tr>
    <td>markdown</td>
    <td>md</td>
    <td></td>
  </tr>
  <tr>
    <td>clike</td>
    <td>shader (x-shader/x-fragment MIME type)</td>
    <td></td>
  </tr>
</table>

Examples of asset name :

    changelog.md
    data.cson
    template.pug


## Includes

You can include a text asset's content into another with the `include` instruction.  
Just write in your asset :  
  
    ftext:include:path/to/the/asset


Replace `path/to/the/asset` by the path to the asset to include inside this one.

The specified asset content will then be included when the asset is parsed with the `fText.parse()` method.

Since assets are usually parsed before the inclusion is performed, it is best to have comment characters _immediately_ before the command.

Ie:

    //ftext:include:path/to/the/asset


## In-game usage

`fText` is the type of the text assets inside your game's code. Get an asset like this:

    let asset = Sup.get( "My Text Asset", fText );
    // or
    let asset = Sup.get( "My Text Asset" ) as fText;

You can access the raw text content of the asset via the `getText()` method :

    let asset = Sup.get( "My Text Asset", fText );
    let data = asset.getText();

You can parse the asset's content with the `parse()` method as well as access all parsers through the static property `fText.parsers` :

Ie:

    let asset = Sup.get( "My Jade Asset", fText );

    let html = asset.parse();

    let elt = fText.parsers.domify( html );

    document.body.appendChild( elt );
    // note that document is not accessible inside your game's code
    // without the DOM plugin you can find at:
    // https://github.com/florentpoujol/superpowers-dom-plugin

- `json`, `cson` and `yml` are parsed to JS object.
- `pug` and `md` > HTML string
- `html` > DOM object
- `styl` > CSS string

## Test/Demo project

The `project` folder contains a test/demo project.

To run it, put the project's `fText` folder in Superpowers' projects folder, and (re)start the server.
