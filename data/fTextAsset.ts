///<reference path="./operational-transform.d.ts"/>

import * as OT from "operational-transform";
import * as fs from "fs";
import * as path from "path";

import fTextSettingsResource from "./fTextSettingsResource";

export default class ScriptAsset extends SupCore.data.base.Asset {

  static schema = {
    text: { type: "string" },
    draft: { type: "string" },
    revisionId: { type: "integer" },
    // syntax: { type: "string" }
  };

  pub: {
    text: string;
    draft: string;
    revisionId: number;
    // sytax: string;
  }

  document: OT.Document;
  hasDraft: boolean;

  // called from the editor onAssetReceived() as well as on server startup
  constructor(id: string, pub: any, serverData?: any) {
    this.document = new OT.Document();
    super(id, pub, ScriptAsset.schema, serverData);
  }

  // called on asset creation
  // options contain the asset's name
  init(options: any, callback: Function) {
    let defaultContent = "";
    
    this.pub = {
      text: defaultContent,
      draft: defaultContent,
      revisionId: 0,
      // syntax: "", // no default syntax (codemirror mode)
    }
    
    super.init(options, callback);
  }

  setup() {
    this.document.text = this.pub.draft;
    for (let i = 0; i < this.pub.revisionId; i++) (<any>this.document.operations).push(0);

    this.hasDraft = this.pub.text !== this.pub.draft;
  }

  restore() {
    if (this.hasDraft) this.emit("setDiagnostic", "draft", "info");
  }

  destroy(callback: Function) {
    /*this.serverData.resources.acquire("fTextSettings", null, (err: Error, fTextSettings: fTextSettingsResource) => {
      // nothing to do here
      this.serverData.resources.release("fTextSettings", null);
      callback();
    });*/
    // just call callback if there is nothing to do with the ressource
    callback();
  }

  // called on server startup
  load(assetPath: string) {
    fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
      this.pub = JSON.parse(json);

      fs.readFile(path.join(assetPath, "text.txt"), { encoding: "utf8" }, (err, text) => {
        this.pub.text = text;

        fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, (err, draft) => {
          // Temporary asset migration (from tyescript plugin)
          if (draft == null) draft = this.pub.text;

          this.pub.draft = draft;
          this.setup();
          this.emit("load");
        });
      });
    });
  }

  save(assetPath: string, callback: (err: Error) => any) {
    let text = this.pub.text; delete this.pub.text;
    let draft = this.pub.draft; delete this.pub.draft;
    // let editorSettings = this.pub.editorSettings; delete this.pub.editorSettings;

    let json = JSON.stringify(this.pub, null, 2);

    this.pub.text = text;
    this.pub.draft = draft;
    // this.pub.editorSettings = editorSettings;

    fs.writeFile(path.join(assetPath, "asset.json"), json, { encoding: "utf8" }, (err) => {
      if (err != null) { callback(err); return; }
      fs.writeFile(path.join(assetPath, "text.txt"), text, { encoding: "utf8" }, (err) => {
        if (err != null) { callback(err); return; }
        fs.writeFile(path.join(assetPath, "draft.txt"), draft, { encoding: "utf8" }, callback);
      });
    });
  }

  server_editText(client: any, operationData: OT.OperationData, revisionIndex: number, callback: (err: string, operationData?: any, revisionIndex?: number) => any) {
    if (operationData.userId !== client.id) { callback("Invalid client id"); return; }

    let operation = new OT.TextOperation();
    if (! operation.deserialize(operationData)) { callback("Invalid operation data"); return; }

    try { operation = this.document.apply(operation, revisionIndex); }
    catch (err) { callback("Operation can't be applied"); return; }

    this.pub.draft = this.document.text;
    this.pub.revisionId++;

    callback(null, operation.serialize(), this.document.operations.length - 1);

    if (!this.hasDraft) {
      this.hasDraft = true;
      this.emit("setDiagnostic", "draft", "info");
    }
    this.emit("change");
  }

  client_editText(operationData: OT.OperationData, revisionIndex: number) {
    let operation = new OT.TextOperation();
    operation.deserialize(operationData);
    this.document.apply(operation, revisionIndex);
    this.pub.draft = this.document.text;
    this.pub.revisionId++;
  }

  server_saveText(client: any, callback: (err: string) => any) {
    this.pub.text = this.pub.draft;

    callback(null);

    if (this.hasDraft) {
      this.hasDraft = false;
      this.emit("clearDiagnostic", "draft");
    }

    this.emit("change");
  }

  client_saveText() { this.pub.text = this.pub.draft; }
}
