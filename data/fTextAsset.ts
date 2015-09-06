import * as OT from "operational-transform";
import * as fs from "fs";
import * as path from "path";

import fTextSettingsResource from "./fTextSettingsResource";

export default class fTextAsset extends SupCore.data.base.Asset {

  static schema = {
    text: { type: "string" },
    draft: { type: "string" },
    revisionId: { type: "integer" },
  };

  pub: {
    text: string;
    draft: string;
    revisionId: number;
  }

  document: OT.Document;
  hasDraft: boolean;

  // called from the editor onAssetReceived() as well as on server startup
  constructor(id: string, pub: any, serverData?: any) {
    super(id, pub, fTextAsset.schema, serverData);
  }

  // called on asset creation
  // options contain the asset's name
  init(options: any, callback: Function) {
    let defaultContent = "";
    
    this.pub = {
      text: defaultContent,
      draft: defaultContent,
      revisionId: 0,
    }

    super.init(options, callback);
  }

  setup() {
    this.document = new OT.Document(this.pub.draft, this.pub.revisionId);
    this.hasDraft = this.pub.text !== this.pub.draft;
  }

  restore() {
    if (this.hasDraft) this.emit("setDiagnostic", "draft", "info");
  }

  destroy(callback: Function) {
    callback();
  }

  // called on server startup
  load(assetPath: string) {
    // NOTE: We must not set this.pub with temporary values here, otherwise
    // the asset will be considered loaded by Dictionary.acquire
    // and the acquire callback will be called immediately

    fs.readFile(path.join(assetPath, "ftext.txt"), { encoding: "utf8" }, (err, text) => {
      fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, (err, draft) => {
        this.pub = { revisionId: 0, text, draft: (draft != null) ? draft : text };
        this.setup();
        this.emit("load");
      });
    });
  }

  // called when it is time to write the asset on disk, not when the user save the asset from the editor
  save(assetPath: string, callback: (err: Error) => any) {
    fs.writeFile(path.join(assetPath, "ftext.txt"), this.pub.text, { encoding: "utf8" }, (err) => {
      if (err != null) { callback(err); return; }

      if (this.hasDraft) {
        fs.writeFile(path.join(assetPath, "draft.txt"), this.pub.draft, { encoding: "utf8" }, callback);
      } else {
        // delete the draft.txt file if there is no draft to save and the file exists
        fs.unlink(path.join(assetPath, "draft.txt"), (err) => {
          if (err != null && err.code !== "ENOENT") { callback(err); return; }
          callback(null);
        });
      }
    });
  }

  server_editText(client: any, operationData: OperationData, revisionIndex: number, callback: (err: string, operationData?: any, revisionIndex?: number) => any) {
    if (operationData.userId !== client.id) { callback("Invalid client id"); return; }

    let operation = new OT.TextOperation();
    if (! operation.deserialize(operationData)) { callback("Invalid operation data"); return; }

    try { operation = this.document.apply(operation, revisionIndex); }
    catch (err) { callback("Operation can't be applied"); return; }

    this.pub.draft = this.document.text;
    this.pub.revisionId++;

    callback(null, operation.serialize(), this.document.getRevisionId() - 1);

    if (!this.hasDraft) {
      this.hasDraft = true;
      this.emit("setDiagnostic", "draft", "info");
    }
    this.emit("change");
  }

  client_editText(operationData: OperationData, revisionIndex: number) {
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
