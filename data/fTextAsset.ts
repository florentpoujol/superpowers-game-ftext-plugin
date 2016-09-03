import * as OT from "operational-transform";
import * as fs from "fs";
import * as path from "path";

type EditTextCallback = SupCore.Data.Base.ErrorCallback & ((err: string, ack: any, operationData: OperationData, revisionIndex: number) => void);

export default class FTextAsset extends SupCore.Data.Base.Asset {

  static schema: SupCore.Data.Schema = {
    text: { type: "string" },
    draft: { type: "string" },
    revisionId: { type: "integer" },
  };

  pub: {
    text: string;
    draft: string;
    revisionId: number;
  };

  document: OT.Document;
  hasDraft: boolean;

  // called from the editor onAssetReceived() as well as on server startup
  constructor(id: string, pub: any, server?: ProjectServer) {
    super(id, pub, FTextAsset.schema, server);
  }

  // called on asset creation
  // options contain the asset's name
  init(options: any, callback: Function): void {
    let defaultContent = "";

    this.pub = {
      text: defaultContent,
      draft: defaultContent,
      revisionId: 0,
    };

    super.init(options, callback);
  }

  setup(): void {
    this.document = new OT.Document(this.pub.draft, this.pub.revisionId);
    this.hasDraft = this.pub.text !== this.pub.draft;
  }

  restore(): void {
    if (this.hasDraft) this.emit("setBadge", "draft", "info");
  }

  destroy(callback: Function): void {
    callback();
  }

  // called on server startup
  load(assetPath: string): void {
    // NOTE: We must not set this.pub with temporary values here, otherwise
    // the asset will be considered loaded by Dictionary.acquire
    // and the acquire callback will be called immediately

    fs.readFile(path.join(assetPath, "ftext.txt"), { encoding: "utf8" }, (err, text) => {
      fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, (err, draft) => {
        let pub = { revisionId: 0, text, draft: (draft != null) ? draft : text };
        // this.setup();
        // this.emit("load");
        this._onLoaded(assetPath, pub);
      });
    });
  }

  // called when it is time to write the asset on disk, not when the user save the asset from the editor
  save(outputPath: string, callback: (err: Error) => any): void {
    this.write(fs.writeFile, outputPath, (err) => {
      if (err != null) { callback(err); return; }

      if (this.hasDraft) {
        fs.writeFile(path.join(outputPath, "draft.txt"), this.pub.draft, { encoding: "utf8" }, callback);
      } else {
        // delete the draft.txt file if there is no draft to save and the file exists
        fs.unlink(path.join(outputPath, "draft.txt"), (err) => {
          if (err != null && err.code !== "ENOENT") { callback(err); return; }
          callback(null);
        });
      }
    });
  }

  clientExport(outputPath: string, callback: (err: Error) => void) {
    this.write(SupApp.writeFile, outputPath, callback);
  }

  private write(writeFile: Function, outputPath: string, callback: (err: Error) => void): void {
    writeFile(path.join(outputPath, "ftext.txt"), this.pub.text, { encoding: "utf8" }, callback);
  }

  server_editText(client: any, operationData: OperationData, revisionIndex: number, callback: EditTextCallback): void {
    if (operationData.userId !== client.id) { callback("Invalid client id"); return; }

    let operation = new OT.TextOperation();
    if (!operation.deserialize(operationData)) { callback("Invalid operation data"); return; }

    try { operation = this.document.apply(operation, revisionIndex); }
    catch (err) { callback("Operation can't be applied"); return; }

    this.pub.draft = this.document.text;
    this.pub.revisionId++;

    callback(null, null, operation.serialize(), this.document.getRevisionId() - 1);

    if (!this.hasDraft) {
      this.hasDraft = true;
      this.emit("setBadge", "draft", "info");
    }
    this.emit("change");
  }

  client_editText(operationData: OperationData, revisionIndex: number): void {
    let operation = new OT.TextOperation();
    operation.deserialize(operationData);
    this.document.apply(operation, revisionIndex);
    this.pub.draft = this.document.text;
    this.pub.revisionId++;
  }

  server_applyDraftChanges(client: SupCore.RemoteClient, options: { ignoreErrors: boolean }, callback: SupCore.Data.Base.ErrorCallback): void {
    this.pub.text = this.pub.draft;

    callback(null);

    if (this.hasDraft) {
      this.hasDraft = false;
      this.emit("clearBadge", "draft");
    }

    this.emit("change");
  }

  client_applyDraftChanges(): void { this.pub.text = this.pub.draft; }

  client_unload(): void { return; } // called when an asset is trashed
}
