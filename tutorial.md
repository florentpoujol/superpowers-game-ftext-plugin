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
    <td>Define the editor's looks.<br> See below for using your own themes.</td>
  </tr>
  <tr>
    <td>Indent with tabs</td>
    <td>Tell whether pressing the Tab key should insert an actual tab character or regular spaces.</td>
  </tr>
  <tr>
    <td>Tab Size</td>
    <td>This define the width (in spaces equivalent) of a tab. <br>
    Updating the value will update all existing tab characters (and not tabs that use spaces) in you text assets.</td>
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

## Syntax

The syntax of the asset defines the data-type of its content and thus change how the syntactic coloration behave and how the asset's content is parsed, if at all.

To set a syntax, just add an extension at the end of the asset's name just like for any standard file.  
Ie: `"styles/main.styl"`.

Supported extensions are : `json`, `cson`, `xml`, `md`, `html`, `jade`, `css`, `styl`, `shader` and `js`.


## Other features

- Code folding
- On save error reporting for `json`, `cson`, `jade` and `stylus`.
- `json` supports standard `//` comments
- Basic autocompletion via the `Ctrl/Cmd + Space` command.

### Includes

You can include an asset into another with the `include` command.  
Just write in you asset :  
  
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

You can access the text content of the asset via the readonly property `text` :
    
    let asset = Sup.get( "My Text Asset", fText );
    let data = asset.text;

You can parse the asset's content with the `parse()` method and access all parsers through the static property `fText.parsers` :

Ie:

    let asset = Sup.get( "My Jade Asset", fText );

    let html = asset.parse();
    
    let elt = fText.parsers.domify( html );

    document.body.appendChild( elt ); 
    // note that document is not accessible inside your game's code
    // without the DOM plugin you can find at:
    // https://github.com/florentpoujol/superpowers-dom-plugin

- `json` and `cson` are parsed to JS object.
- `jade` and `md` > HTML string
- `html` > DOM object
- `styl` > CSS string

The `fText.parsers` static property has this definition :

    static parsers: {
      jsonlint: jsonlint,           // https://github.com/zaach/jsonlint
      CSON: cson,                   // https://github.com/bevry/cson
      domify: (text: string)=>any,  // https://github.com/component/domify
      markdown: markdown,           // https://github.com/evilstreak/markdown-js
      jade: jade,                   // https://github.com/jadejs/jade
      stylus: any,                  // https://github.com/stylus/stylus
    };

    interface jsonlint {
      parse(text: string): string;
    }

    interface cson {
      parse(text: string): string;
    }

    interface jade {
      compile(text: string): ()=>void;
    }

    interface markdown {
      toHTML(md: string): string;
    }
