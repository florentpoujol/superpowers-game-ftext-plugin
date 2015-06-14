///<reference path="./typings/tsd.d.ts"/>
///<reference path="../../app/typings/tsd.d.ts"/>
///<reference path="../../app/SupAPI/SupAPI.d.ts"/>
///<reference path="../../app/SupClient/SupClient.d.ts"/>
///<reference path="../../app/SupCore/SupCore.d.ts"/>
///<reference path="../../app/system/SupEngine/SupEngine.d.ts"/>
///<reference path="../../app/system/SupRuntime/SupRuntime.d.ts"/>


// IMPORTANT
// see comment at the top of fTextSettignsEditor
declare module "domify" {
  export function parse(html: string): HTMLElement;
}

declare module "jade" {
  export function parse(jade: string): string;
}
declare module "stylus" {}
declare module "markdown" {
  export var markdown: any;
}
declare module "less" {}
declare module "cson-parser" {}
declare module "jsonlint" {}
