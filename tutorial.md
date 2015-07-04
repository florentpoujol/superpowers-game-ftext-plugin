# Superpowers fText asset plugin

This plugin brings a generic text asset of type `fText` to [Superpowers, the extensible HTML5 2D+3D game engine](http://sparklinlabs.com).

[Go back to the repository on Github.](https://github.com/florentpoujol/superpowers-ftext-plugin)

## Creating a new asset

When creating a new asset in Superpowers' client, select the `fText` type.

## Editor features and settings

You can configure the editor through the Settings tool :

![fText settings editor](editor_settings.jpeg)

<table>
  <tr>
    <th>Setting</th>
    <th>Action / Effect</th>
  </tr>
  <tr>
    <td>Theme</td>
    <td>Define the editor's looks.<br> See below for using your own themes.</td>
  </tr>
  <tr>
    <td>Indent Unit</td>
    <td>Define how many spaces a tab should take.<br>Changing the value does not update existing tabs.</td>
  </tr>
  <tr>
    <td>Key map</td>
    <td>Define the basic set of keyboard shortcuts and commands.</td>
  </tr>
  <tr>
    <td>Auto close brackets</td>
    <td>Automatically add the closing character when writing {, (, [, " and '</td>
  </tr>
  <tr>
    <td>Highlight active line</td>
    <td>Makes the current line stand out.</td>
  </tr>
  <tr>
    <td>Highlight trailing spaces</td>
    <td>Highlight trailing spaces in red.</td>
  </tr>
  <tr>
    <td>Highlight matching tags</td>
    <td>In languages that have pairs of tags -like HTML- having the mouse cursor over one will highlight the other one.<br>Pressing <code>Ctrl/Cmd+J</code> will jump to the matching tag.</td>
  </tr>
  <tr>
    <td>Highlight matching words</td>
    <td>When a word is selected, this highlight all other occurrences in the document.</td>
  </tr>
</table>

### Adding you own themes

Copy one of the themes you can find the the plugin's `public/editors/fText/codemirror-themes` folder.

Edit the file name and the theme name inside the CSS classes, as well as all values to you likings.

In the editor settings, add the theme name in the `Custom Themes` fields.  
You can have several custom themes separated by comas.

Close the Settings tool then reopen it, so that you can choose your custom theme at the bottom of the theme's list.

### Other features

- Support for code folding

## Syntax




### Mode

The mode defines the data-type (JSON, HTML, CSS, ...).  
It's important to specify it for the syntactic coloration and when parsing the asset's content.

Unlike other settings, you can set a different mode on every assets.  
Just write `codemirror-mode:[value]` anywhere in the file (in comments at the beginning of the file, for instance).

Replace `[value]` by a mode's name, a MIME type or a shortcut as defined in the table below.  
There is no default mode.

<table>
  <tr>
    <th>Laguage</th>
    <th>Mode value</th>
  </tr>
  <tr>
    <td>HTML</td>
    <td>html</td>
  </tr>
  <tr>
    <td>Jade</td>
    <td>jade</td>
  </tr>
  <tr>
    <td>Markdown</td>
    <td>markdown</td>
  </tr>
  <tr>
    <td>CSS</td>
    <td>css</td>
  </tr>
  <tr>
    <td>Less</td>
    <td>less</td>
  </tr>
  <tr>
    <td>JSON</td>
    <td>json<br>Note that you can write JS single line comments within you JSON.</td>
  </tr>
  <tr>
    <td>CSON</td>
    <td>cson</td>
  </tr>
  <tr>
    <td>HLSL / GLSL</td>
    <td>shader</td>
  </tr>
</table>

JSON, CSON and Less are parsed on save. Any error will appear in the gutter and in the error dialog below the text.

Ie: JSON with Monokai theme, inline comments and in-editor error reporting on save. 

![bma](https://dl.dropboxusercontent.com/u/51314747/superpowers/Text%20Asset/json_editor.png)

## In-game usage

`fText` is the type of the text assets inside your game's code. Get an asset like this:

    var asset = Sup.get( "My Text Asset", fText );
    // or
    var asset = <fText>Sup.get( "My Text Asset" );

You can access the text content of the text via the readonly property `text` :
    
    var asset = Sup.get( "My Text Asset", fText );
    var data = asset.text;

You can convert the data using the `parse[Datatype](text?: string)` functions described below in this doc.  
All functions will use either the asset's text, or the text passed as their only argument.

Ie:

    var asset = Sup.get( "My Jade Asset", fText );
    
    var html = asset.parseJade();
    var elt = asset.parseHTML( html );

    document.body.appendChild( elt ); 
    // note that document is not accessible inside your game''s code
    // without the DOM plugin you can find at:
    // https://github.com/florentpoujol/superpowers-dom-plugin


You can also use the `parse()` function, provided that the mode can be found in the line `codemirror-mode` line or as second argument.

    var asset = Sup.get( "My Jade Asset", fText );
      
    var html = asset.parse(); // parse from Jade to HTML using parseJade() because "jade" is the mode specified in the asset's content.
    var elt = asset.parseHTML( html );


### Automatically load styles at runtime

Just write `loadStyleAtRuntime: true` anywhere in CSS or Less assets to have their content automatically added to the game's page's head at runtime.
