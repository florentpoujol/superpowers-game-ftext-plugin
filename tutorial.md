# Superpowers fText asset plugin

This plugin brings a generic text asset of type `fText` to [Superpowers, the extensible HTML5 2D+3D game engine](http://sparklinlabs.com).

[Go back to the repository on Github.](https://github.com/florentpoujol/superpowers-ftext-plugin)

## Creating a new asset

When creating a new asset in Superpowers' client, select the `fText` type.

## Editor features and settings

You can configure the editor through the Settings tool :

<table>
  <tr>
    <th>Setting</th>
    <th>Action / Effect</th>
  </tr>
  <tr>
    <td>Theme</td>
    <td>Define the editor's looks.<br> See below for using a custom theme.</td>
  </tr>
  <tr>
    <td>Tab Size</td>
    <td>This define the width (in spaces equivalent) of a tab. <br>
    Updating the value will update all existing tab characters (and not tabs that use spaces) in you text assets.</td>
  </tr>
  <tr>
    <td>Indent with tabs</td>
    <td>Tell whether pressing the Tab key should insert an actual tab character or regular spaces.</td>
  </tr>
  <tr>
    <td>Key map</td>
    <td>Define the basic set of keyboard shortcuts and commands.</td>
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
    <td>Lint syntaxes</td>
    <td>Enable/disable linting of the following syntaxes : <br>
      json, javascript, cson, yaml, jade, stylus, css.
    </td>
  </tr>
</table>

### Using a custom theme

Copy one of the themes you can find the the plugin's `public/editors/fText/codemirror-themes` folder.

Edit the file name and the theme name inside the CSS classes, as well as all values to you likings.

In the editor settings, add the theme's name in the custom theme input field then select `Custom` at the top of the list in the select field.  

## Syntax

The syntax of the asset defines the data-type of its content and thus change how the syntactic coloration behave and how the asset's content is parsed and linted, if at all.

To set a syntax, just add an extension at the end of the asset's name just like for any standard file.  
Ie: `"styles/main.styl"`.

Supported extensions (and syntaxes) are : `json`, `js` (javascript), `cson`, `yml` (Yaml), `md` (Markdown), `html`, `jade`, `css`, `styl` (stylus), `xml` and `shader`.


## Other features

- Code folding
- Basic autocompletion via the `Ctrl/Cmd + Space` command.
- `json` supports standard `//` comments

## Includes

You can include a text asset's content into another with the `include` instruction.  
Just write in your asset :  
  
    [ftext: include: path/to/the/asset]


Replace `path/to/the/asset` by the path to the asset to include inside this one.

The specified asset content will then be included when the asset is parsed with the `fText.parse()` method.

Since assets are usually parsed before the inclusion is performed, it is best to have comment characters _immediately_ before the command.

    //[ftext: include: path/to/the/asset]


## In-game usage

`fText` is the type of the text assets inside your game's code. Get an asset like this:

    let asset = Sup.get( "My Text Asset", fText );
    // or
    let asset = <fText>Sup.get( "My Text Asset" );

You can access the raw text content of the asset via the readonly property `text` :
    
    let asset = Sup.get( "My Text Asset", fText );
    let data = asset.text;

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
- `jade` and `md` > HTML string
- `html` > DOM object
- `styl` > CSS string
