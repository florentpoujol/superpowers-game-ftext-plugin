declare module Sup {
  class Asset {
    name: string;
    type: string;
    children: Array<string>;
    __inner: any;
    constructor(inner: {[key:string]: any;});
  }

  function get(path: string, options?: { "ignoreMissing": boolean; }): Asset;
  function get<T extends Asset>(path: string, type: new(inner: {[key:string]: any;}) => T, options?: { "ignoreMissing": boolean; }): T;
}
