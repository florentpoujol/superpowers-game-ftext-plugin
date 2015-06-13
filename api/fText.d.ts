// fTextAsset plugin
// https://github.com/florentpoujol/superpowers-text-asset-plugin
// Adds a generic text asset of type text/Sup.Text

// Documentation:
// https://florentpoujol.github.io/superpowers-text-asset-plugin

// You can also access the documentation offline in the plugin's "public/docs" folder 
// or via the "Docs browser" tool provided by the "Docs browser" plugin: https://github.com/florentpoujol/superpowers-docs-browser-plugin

declare module fText {
  function parseInstructions(text: string);

  class fText extends Sup.Asset {
    text: string;
  }
}

