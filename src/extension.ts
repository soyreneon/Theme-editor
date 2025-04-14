// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
const requireJSON = require("json-easy-strip");
import * as fs from "fs";

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
  { scope: string[]; type: "foreground" | "background" }
>;
type SyntaxMap = Record<string, string[]>;

// Define types for global settings
interface GlobalCustomizations {
  colors: Record<string, string>;
  tokenColors: Array<{
    scope: string[];
    settings: { foreground?: string; background?: string };
  }>;
}

/**
 * Manages them editor webview
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
        this.loadCurrentTheme();
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

  public async getThemeJsonByName(themeName: string): Promise<{
    themeJson: ThemeJson;
    globalCustomizations: GlobalCustomizations;
  } | null> {
    const globalSettingsPath = vscode.Uri.file(
      process.platform === "darwin"
        ? `${process.env.HOME}/Library/Application Support/Code/User/settings.json`
        : `${process.env.HOME}/.config/Code/User/settings.json`
    );

    let globalSettings: any = {};
    try {
      const settingsContent = await vscode.workspace.fs.readFile(
        globalSettingsPath
      );
      globalSettings = requireJSON.strip(settingsContent.toString());
    } catch (err) {
      console.error("Error reading global settings.json:", err);
    }

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
              const json: ThemeJson = requireJSON.strip(decoded);

              return {
                themeJson: json,
                globalCustomizations: {
                  colors:
                    globalSettings["workbench.colorCustomizations"][
                      `[${themeName}]`
                    ] || {},
                  tokenColors:
                    globalSettings["editor.tokenColorCustomizations"][
                      `[${themeName}]`
                    ]?.textMateRules || [],
                },
              };
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

    // Helper function to normalize color to 6-digit hex without alpha and uppercase
    const normalizeColor = (color: string): string => {
      if (color.length === 4) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
      } else if (color.length === 5) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
      } else if (color.length === 9) {
        return color.substring(0, 7).toUpperCase();
      }
      return color.toUpperCase();
    };

    // Process colors
    for (const [property, value] of Object.entries(theme.colors ?? {})) {
      const normalizedColor = normalizeColor(value);
      if (!colorsMap[normalizedColor]) {
        colorsMap[normalizedColor] = [];
      }
      colorsMap[normalizedColor].push(property);
    }

    // Process tokenColors
    const processedScopes = new Set<string>();
    for (const token of theme.tokenColors ?? []) {
      const { foreground, background } = token.settings;
      const scope = Array.isArray(token.scope)
        ? token.scope
        : token.scope
        ? [token.scope]
        : ["global"];

      scope.forEach((s) => {
        if (foreground) {
          const normalizedForeground = normalizeColor(foreground);
          if (!processedScopes.has(`${s}-foreground`)) {
            if (!tokenColorsMap[normalizedForeground]) {
              tokenColorsMap[normalizedForeground] = {
                scope: [],
                type: "foreground",
              };
            }
            tokenColorsMap[normalizedForeground].scope.push(s);
            processedScopes.add(`${s}-foreground`);
          }
        }

        if (background) {
          const normalizedBackground = normalizeColor(background);
          if (!processedScopes.has(`${s}-background`)) {
            if (!tokenColorsMap[normalizedBackground]) {
              tokenColorsMap[normalizedBackground] = {
                scope: [],
                type: "background",
              };
            }
            tokenColorsMap[normalizedBackground].scope.push(s);
            processedScopes.add(`${s}-background`);
          }
        }
      });
    }

    // Process syntax
    const processedSyntax = new Set<string>();
    for (const [categories, color] of Object.entries(theme.syntax ?? {})) {
      const normalizedColor = normalizeColor(color);
      const scopes = categories.split(",").map((item) => item.trim());

      scopes.forEach((scope) => {
        if (!processedSyntax.has(`${scope}-${normalizedColor}`)) {
          if (!syntaxMap[normalizedColor]) {
            syntaxMap[normalizedColor] = [];
          }
          syntaxMap[normalizedColor].push(scope);
          processedSyntax.add(`${scope}-${normalizedColor}`);
        }
      });
    }

    return { colorsMap, tokenColorsMap, syntaxMap };
  }

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

  public sortColorsByAppereances(colormaps: {
    colorsMap: ColorUsageMap;
    tokenColorsMap: TokenColorMap;
    syntaxMap: SyntaxMap;
  }) {
    // Create a unified colorCounts object
    const colorCounts: Record<string, { count: number }> = {};

    // Count elements in colorsMap
    for (const [color, properties] of Object.entries(colormaps.colorsMap)) {
      if (!colorCounts[color]) {
        colorCounts[color] = { count: 0 };
      }
      colorCounts[color].count += properties.length;
    }

    // Count elements in tokenColorsMap (based on scope length)
    for (const [color, tokenData] of Object.entries(colormaps.tokenColorsMap)) {
      if (!colorCounts[color]) {
        colorCounts[color] = { count: 0 };
      }
      colorCounts[color].count += tokenData.scope.length;
    }

    // Count elements in syntaxMap
    for (const [color, categories] of Object.entries(colormaps.syntaxMap)) {
      if (!colorCounts[color]) {
        colorCounts[color] = { count: 0 };
      }
      colorCounts[color].count += categories.length;
    }

    // Sort colors by count in descending order and return as an array of color keys
    return Object.entries(colorCounts)
      .sort((a, b) => b[1].count - a[1].count) // More elements first
      .map(([color]) => color);
  }

  private loadCurrentTheme(): void {
    const currentTheme = vscode.workspace
      .getConfiguration("workbench")
      .get<string>("colorTheme");

    this.getThemeJsonByName(currentTheme as string).then((result) => {
      if (result) {
        const { themeJson, globalCustomizations } = result;
        // console.log(" theme", JSON.stringify(themeJson));
        // console.log(" out side!", JSON.stringify(globalCustomizations));

        const maptypes = this.mergeThemeAndCustomizations(
          themeJson,
          globalCustomizations
        );
        //console.log(" maptypes", JSON.stringify(maptypes));
        /*
        // Merge global customizations
        themeJson.colors = {
          ...themeJson.colors,
          ...globalCustomizations.colors,
        };
        
        themeJson.tokenColors = [
          ...(themeJson.tokenColors || []),
          ...globalCustomizations.tokenColors,
        ];
        */
        const fullThemeJson: ThemeJson = {
          ...themeJson,
          colors: {
            ...themeJson.colors,
            ...globalCustomizations.colors,
          },
          tokenColors: [
            ...(themeJson.tokenColors || []),
            ...globalCustomizations.tokenColors,
          ],
          syntax: {
            ...(themeJson.syntax || {}),
          },
        };

        const colormaps = this.getColorUsage(fullThemeJson);

        // Color list without transparency
        const colors = this.sortColorsByAppereances(colormaps);
        this._panel?.webview.postMessage({
          type: "themeChanged",
          theme: currentTheme,
          json: themeJson,
          colormaps: colormaps,
          colors: colors,
        });
      }
    });
  }

  private mergeThemeAndCustomizations(
    themeJson: ThemeJson,
    globalCustomizations: GlobalCustomizations
  ) {
    const result: Record<string, { color: string; override?: string }> = {};

    // Process colors from themeJson
    for (const [property, color] of Object.entries(themeJson.colors || {})) {
      result[property] = { color };
    }

    // Process tokenColors from themeJson
    for (const token of themeJson.tokenColors || []) {
      const { foreground, background } = token.settings;
      const scope = Array.isArray(token.scope)
        ? token.scope
        : token.scope
        ? [token.scope]
        : ["global"];

      if (foreground) {
        scope.forEach((s) => {
          result[s] = result[s] || { color: foreground };
        });
      }

      if (background) {
        scope.forEach((s) => {
          result[s] = result[s] || { color: background };
        });
      }
    }

    // Process syntax from themeJson
    for (const [categories, color] of Object.entries(themeJson.syntax || {})) {
      const scopes = categories.split(",").map((item) => item.trim());
      scopes.forEach((scope) => {
        result[scope] = result[scope] || { color };
      });
    }

    // Process globalCustomizations
    for (const [property, overrideColor] of Object.entries(
      globalCustomizations.colors || {}
    )) {
      if (result[property]) {
        result[property].override = overrideColor as string;
      } else {
        result[property] = { color: overrideColor as string };
      }
    }

    for (const token of globalCustomizations.tokenColors || []) {
      const { foreground, background } = token.settings;
      const scope = token.scope || ["global"];

      if (foreground) {
        scope.forEach((s: any) => {
          if (result[s]) {
            result[s].override = foreground;
          } else {
            result[s] = { color: foreground };
          }
        });
      }

      if (background) {
        scope.forEach((s: any) => {
          if (result[s]) {
            result[s].override = background;
          } else {
            result[s] = { color: background };
          }
        });
      }
    }

    return result;
  }

  private _update() {
    const webview = this._panel.webview;
    this.loadCurrentTheme();
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

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

    const stylesAccordionPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "accordion.css"
    );

    const stylesLoaderPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "loader.css"
    );

    const stylesModalPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "modal.css"
    );

    const stylesCustomPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "custom.css"
    );

    const saveSvgUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "save.svg")
    );

    // console.log("saveSvgUri", saveSvgUri);
    const resetSvgUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.svg")
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    const stylesAccordionUri = webview.asWebviewUri(stylesAccordionPath);
    const stylesLoaderUri = webview.asWebviewUri(stylesLoaderPath);
    const stylesModalUri = webview.asWebviewUri(stylesModalPath);
    const stylesCustomUri = webview.asWebviewUri(stylesCustomPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

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
				<link href="${stylesAccordionUri}" rel="stylesheet">
				<link href="${stylesLoaderUri}" rel="stylesheet">
				<link href="${stylesModalUri}" rel="stylesheet">
				<link href="${stylesCustomUri}" rel="stylesheet">

				<title>${activeTheme}</title>
			</head>
			<body>
				<h2 id="theme-name">${activeTheme}</h2>
        <hr/>
				<h3 id="colors">
          <div class="loader-wrapper">
            <span class="loader"></span>
          </div>
        </h3>
        <script nonce="${nonce}" >
          const saveIconUri = "${saveSvgUri}";
          const resetIconUri = "${resetSvgUri}";
        </script>
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
