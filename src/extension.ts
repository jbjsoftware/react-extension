import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("atelier.chatView", provider),
    vscode.commands.registerCommand("atelier.newChat", () =>
      provider.post({ type: "newChat" }),
    ),
    vscode.commands.registerCommand("atelier.openChat", () =>
      vscode.commands.executeCommand("atelier.chatView.focus"),
    ),
  );
}

class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "dist", "webview"),
      ],
    };
    view.webview.html = this.html(view.webview);
    view.webview.onDidReceiveMessage(async (message) => {
      if (message.type === "insertText") {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
          return void vscode.window.showInformationMessage(
            "Open a file to insert this code.",
          );
        await editor.edit((edit) =>
          edit.insert(editor.selection.active, message.text),
        );
      }
      if (message.type === "openFile") {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders?.length) return;
        const uri = vscode.Uri.joinPath(folders[0].uri, message.path);
        try {
          await vscode.window.showTextDocument(uri);
        } catch {
          vscode.window.showWarningMessage(`Could not open ${message.path}`);
        }
      }
    });
  }

  post(message: unknown) {
    this.view?.webview.postMessage(message);
  }

  private html(webview: vscode.Webview) {
    const root = vscode.Uri.joinPath(this.extensionUri, "dist", "webview");
    const script = webview.asWebviewUri(
      vscode.Uri.joinPath(root, "assets", "app.js"),
    );
    const style = webview.asWebviewUri(
      vscode.Uri.joinPath(root, "assets", "index.css"),
    );
    const nonce = Math.random().toString(36).slice(2);
    return `<!doctype html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${style}">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">
    </head>
    <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${script}">
    </script>
    </body>
    </html>`;
  }
}

export function deactivate() {}
