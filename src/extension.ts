// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
//import { CatScratchEditorProvider } from "./editTheme";

// const cats = {
//   "Coding Cat": "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
//   "Compiling Cat": "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif",
//   "Testing Cat": "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
// };
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "themeeditor" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  /*
  const disposable = vscode.commands.registerCommand(
    "themeeditor.openThemeEditor",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from ThemeEditor! XD");
    }
  );

  context.subscriptions.push(disposable);
  */
  //  context.subscriptions.push(CatScratchEditorProvider.register(context));

  context.subscriptions.push(
    vscode.commands.registerCommand("themeeditor.openThemeEditor", () => {
      ThemeEditorPanel.createOrShow(context.extensionUri);
    })
  );

  // context.subscriptions.push(
  //   vscode.commands.registerCommand("catCoding.doRefactor", () => {
  //     if (ThemeEditorPanel.currentPanel) {
  //       ThemeEditorPanel.currentPanel.doRefactor();
  //     }
  //   })
  // );

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event
    vscode.window.registerWebviewPanelSerializer(ThemeEditorPanel.viewType, {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: unknown
      ) {
        console.log(`Got state: ${state}`);
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
        ThemeEditorPanel.revive(webviewPanel, context.extensionUri);
      },
    });
  }
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
  };
}

type ThemeJson = {
  name: string;
  type: string;
  colors?: Record<string, string>;
  tokenColors?: {
    name?: string;
    scope?: string | string[];
    settings: {
      foreground?: string;
      background?: string;
      fontStyle?: string;
    };
  }[];
  syntax?: Record<string, string>;
};

type ColorUsageMap = Record<string, string[]>;
type TokenColorMap = Record<
  string,
  Array<{ name: string; scope?: string[] } | "foreground" | "background">
>;
type SyntaxMap = Record<string, string[]>;

/**
 * Manages cat coding webview panels
 */
class ThemeEditorPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ThemeEditorPanel | undefined;

  public static readonly viewType = "themeEditor";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (ThemeEditorPanel.currentPanel) {
      ThemeEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ThemeEditorPanel.viewType,
      "Theme Editor",
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri)
    );

    ThemeEditorPanel.currentPanel = new ThemeEditorPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    ThemeEditorPanel.currentPanel = new ThemeEditorPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    // this._panel.onDidChangeViewState(
    //   () => {
    //     if (this._panel.visible) {
    //       this._update();
    //     }
    //   },
    //   null,
    //   this._disposables
    // );

    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("workbench.colorTheme")) {
        const currentTheme = vscode.workspace
          .getConfiguration("workbench")
          .get("colorTheme");

        this.getThemeJsonByName(currentTheme as string).then((json) => {
          if (json) {
            //console.log("Theme config:", json);
            //objTheme = json;
            const colors = this.getColorUsage(json);
            this._panel?.webview.postMessage({
              type: "themeChanged",
              theme: currentTheme,
              json: json,
              colors: colors,
            });
          }
        });

        // this._panel?.webview.postMessage({
        //   type: "themeChanged",
        //   theme: currentTheme,
        //   json: objTheme,
        // });
      }
    });

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public async getThemeJsonByName(themeName: string) {
    for (const ext of vscode.extensions.all) {
      const contributes = ext.packageJSON.contributes;

      if (contributes && contributes.themes) {
        for (const theme of contributes.themes) {
          if (
            theme.label === themeName ||
            theme.id === themeName ||
            theme.name === themeName
          ) {
            const themePath = vscode.Uri.joinPath(ext.extensionUri, theme.path);

            try {
              const themeContent = await vscode.workspace.fs.readFile(
                themePath
              );
              const decoded = Buffer.from(themeContent).toString("utf8");
              const json = JSON.parse(decoded);
              return json;
            } catch (err) {
              console.error("Error reading theme JSON:", err);
            }
          }
        }
      }
    }

    vscode.window.showWarningMessage(`Theme "${themeName}" not found.`);
    return null;
  }

  public getColorUsage(theme: ThemeJson): {
    colorsMap: ColorUsageMap;
    tokenColorsMap: TokenColorMap;
    syntaxMap: SyntaxMap;
  } {
    const colorsMap: ColorUsageMap = {};
    const tokenColorsMap: TokenColorMap = {};
    const syntaxMap: SyntaxMap = {};

    // Procesar colors
    for (const [property, value] of Object.entries(theme.colors ?? {})) {
      if (!colorsMap[value]) {
        colorsMap[value] = [];
      }
      colorsMap[value].push(property);
    }

    // Procesar tokenColors
    for (const token of theme.tokenColors ?? []) {
      const { foreground, background } = token.settings;
      const name = token.name ?? "Unnamed";
      const scope = Array.isArray(token.scope)
        ? token.scope
        : token.scope
        ? [token.scope]
        : [];

      if (foreground) {
        if (!tokenColorsMap[foreground]) {
          tokenColorsMap[foreground] = [];
        }

        if (background) {
          tokenColorsMap[foreground].push("foreground");

          if (!tokenColorsMap[background]) {
            tokenColorsMap[background] = [];
          }
          tokenColorsMap[background].push("background");
        } else {
          tokenColorsMap[foreground].push({ name, scope });
        }
      } else if (background) {
        if (!tokenColorsMap[background]) {
          tokenColorsMap[background] = [];
        }
        tokenColorsMap[background].push({ name, scope });
      }
    }

    // Procesar syntax
    for (const [categories, color] of Object.entries(theme.syntax ?? {})) {
      const cleanCategories = categories
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean); // eliminar vacíos

      if (!syntaxMap[color]) {
        syntaxMap[color] = [];
      }

      syntaxMap[color].push(...cleanCategories);
    }

    return { colorsMap, tokenColorsMap, syntaxMap };
  }

  /*
  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: "refactor" });
  }
    */

  public dispose() {
    ThemeEditorPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;

    // Vary the webview's content based on where it is located in the editor.
    // switch (this._panel.viewColumn) {
    //   case vscode.ViewColumn.Two:
    //     this._updateForCat(webview, "Compiling Cat");
    //     return;

    //   case vscode.ViewColumn.Three:
    //     this._updateForCat(webview, "Testing Cat");
    //     return;

    //   case vscode.ViewColumn.One:
    //   default:
    //     this._updateForCat(webview, "Coding Cat");
    //     return;
    // }
    //this._panel.title = catName;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  // private _updateForCat(webview: vscode.Webview, catName: keyof typeof cats) {
  //   this._panel.title = catName;
  //   this._panel.webview.html = this._getHtmlForWebview(webview, cats[catName]);
  // }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    // let all = await vscode.workspace.getConfiguration();
    const workSpaceConfig = vscode.workspace.getConfiguration("workbench");
    //console.log(workSpaceConfig.get("colorTheme"));
    const activeTheme = workSpaceConfig.get("colorTheme");

    const scriptPathOnDisk = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "main.js"
    );

    // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "reset.css"
    );
    const stylesPathMainPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();
    // <img src="${catGifPath}" width="300" />

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>${activeTheme}</title>
			</head>
			<body>
				<h1 id="lines-of-code-counter">0</h1>
				<h2 id="theme-name">${activeTheme}</h2>
        <hr/>
				<h3 id="colors">${activeTheme}</h3>
        <p>end</p>
				<h3 id="theme-json">${activeTheme}</h3>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// This method is called when your extension is deactivated
export function deactivate() {}
