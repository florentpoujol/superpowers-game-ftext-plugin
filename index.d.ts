///<reference path="./typings/tsd.d.ts"/>
///<reference path="../../app/typings/tsd.d.ts"/>
///<reference path="../../app/SupAPI/SupAPI.d.ts"/>
///<reference path="../../app/SupClient/SupClient.d.ts"/>
///<reference path="../../app/SupCore/SupCore.d.ts"/>
///<reference path="../../app/system/SupEngine/SupEngine.d.ts"/>
///<reference path="../../app/system/SupRuntime/SupRuntime.d.ts"/>

declare module "domify" {
  export function parse(html: string): HTMLElement;
  // export = domify;
}
