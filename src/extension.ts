// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
//const requireJSON = require("json-easy-strip");
//import stripJsonComments from 'strip-json-comments';

//const { parse } = require("jsonc-parser");
// import * as fs from "fs";
import {
  type ThemeJson,
  type FullThemeJson,
  // type ColorUsageMap,
  type TokenColorMap,
  type ColorStructure,
  // type SyntaxMap,
  type ColorMap,
  type GlobalCustomizations,
  type TokenColorCustomization,
  type TextMateRule,
} from "../types";
import {
  normalizeColor,
  updateTokenColorCustomization,
  getThemeJsonByName,
  mergeSyntaxThemes,
  // mergeTextMateRules,
  mapTextMateRules,
} from "./utils";

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
    localResourceRoots: [
      vscode.Uri.joinPath(extensionUri, "media"),
      vscode.Uri.joinPath(extensionUri, "dist"),
      vscode.Uri.joinPath(
        extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist"
      ),
    ],
  };
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
  private colormaps: ColorMap = {
    colorsMap: {},
    tokenColorsMap: {},
    syntaxMap: {},
  };
  private themeObj: ThemeJson = { name: "" };
  private themeName: string = "";
  private globalSettings: GlobalCustomizations = {
    colors: {},
    tokenColors: {},
  };

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
          case "save":
            vscode.window.showErrorMessage(`${message.color}, ${message.old}`);
            // new method: get older color, search on this.colormaps and replace to the new color on settings
            // if it's already in the original theme do nothing, if not add it or change it
            // this.colormaps
            this.updateColor(message.old, message.color);
            return;
          case "reset":
            vscode.window.showErrorMessage(message.color);
            return;
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public updateColor = async (previousColor: string, newColor: string) => {
    const settingsColorKeys = this.colormaps.colorsMap[previousColor] || [];
    const settingsTokenKeys =
      this.colormaps.tokenColorsMap[previousColor] || {};
    const settingsSyntaxKeys = this.colormaps.syntaxMap[previousColor] || [];

    // Get the current global settings
    const configuration = vscode.workspace.getConfiguration();
    const colorCustomizations =
      configuration.get<Record<string, any>>("workbench.colorCustomizations") ||
      {};

    const tokenColorCustomizations =
      configuration.get<TokenColorCustomization>(
        "editor.tokenColorCustomizations"
      ) || {};

    // Ensure the theme-specific customizations exist
    const themeColorCustomizations =
      colorCustomizations[`[${this.themeName}]`] || {};
    const themeTokenColorCustomizations =
      tokenColorCustomizations[`[${this.themeName}]`] || {};

    // themeColorCustomizations.textMateRules
    // Update the theme-specific customizations with the new color
    settingsColorKeys.forEach((setting) => {
      themeColorCustomizations[setting] = newColor;
    });
    // syntax is placed in tokenColorCustomizations as well
    settingsSyntaxKeys.forEach((setting) => {
      themeTokenColorCustomizations[setting] = newColor;
    });
    const updated = updateTokenColorCustomization(
      themeTokenColorCustomizations,
      settingsTokenKeys,
      previousColor,
      newColor
    );
    console.log("***", JSON.stringify(updated));
    // settingsTokenKeys.scope.forEach((setting) => {
    //   themeTokenColorCustomizations.textMateRules.filter(
    //     (rule: TextMateRule) =>
    //       (Array.isArray(rule.scope) && !rule.scope.includes(setting)) ||
    //       rule.scope !== setting
    //   );

    //   // fix
    //   // themeTokenColorCustomizations[setting] = newColor;
    // });

    // Update the global settings with the modified customizations
    colorCustomizations[`[${this.themeName}]`] = themeColorCustomizations;

    /* 
    ! dont remove, this save the theme
    try {
      await configuration.update(
        "workbench.colorCustomizations",
        colorCustomizations,
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage(
        `Updated color for ${this.themeName} successfully!`
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to update color: ${error.message}`
      );
    }
    ! end of disclaimer
    */
  };

  public getColorUsage(theme: FullThemeJson): {
    colorsMap: ColorStructure;
    tokenColorsMap: TokenColorMap;
    syntaxMap: ColorStructure;
  } {
    const colorsMap: ColorStructure = {};
    const tokenColorsMap: TokenColorMap = {};
    const syntaxMap: ColorStructure = {};

    // Process colors
    for (const [property, value] of Object.entries(theme.colors ?? {})) {
      const normalizedColor = normalizeColor(value);
      if (!colorsMap[normalizedColor]) {
        colorsMap[normalizedColor] = [];
      }
      colorsMap[normalizedColor].push(property);
    }

    // Process tokenColors
    console.log("token", Object.entries(theme.tokenColors ?? {}));
    for (const [scope, tokenData] of Object.entries(theme.tokenColors ?? {})) {
      const { foreground, background } = tokenData;

      if (foreground) {
        const normalizedForeground = normalizeColor(foreground);
        if (!tokenColorsMap[normalizedForeground]) {
          tokenColorsMap[normalizedForeground] = {
            scope: [],
            type: "foreground",
          };
        }
        tokenColorsMap[normalizedForeground].scope.push(scope);
      }

      if (background) {
        const normalizedBackground = normalizeColor(background);
        if (!tokenColorsMap[normalizedBackground]) {
          tokenColorsMap[normalizedBackground] = {
            scope: [],
            type: "background",
          };
        }
        tokenColorsMap[normalizedBackground].scope.push(scope);
      }
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
    colorsMap: ColorStructure;
    tokenColorsMap: TokenColorMap;
    syntaxMap: ColorStructure;
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
    this.themeName =
      vscode.workspace
        .getConfiguration("workbench")
        .get<string>("colorTheme") ?? "";

    getThemeJsonByName(this.themeName as string).then((result) => {
      if (result) {
        const { themeJson, globalCustomizations } = result;
        this.themeObj = themeJson;
        this.globalSettings = globalCustomizations;

        // probably won't need this
        /*
        const maptypes = this.mergeThemeAndCustomizations(
          themeJson,
          globalCustomizations
        );
        */
        // console.log("themejason", JSON.stringify(themeJson));
        // console.log("global", JSON.stringify(globalCustomizations));
        // console.log("maptypes", JSON.stringify(maptypes));
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
        const { textMateRules, ...syntaxCustomizations } =
          globalCustomizations.tokenColors ?? {};

        const { scopeMap, nameColorMap } = mapTextMateRules(
          themeJson.tokenColors || [],
          textMateRules || []
        );

        const fullThemeJson: FullThemeJson = {
          ...themeJson,
          colors: {
            ...themeJson.colors,
            ...globalCustomizations.colors,
          },
          // tokenColors: [],
          tokenColors: scopeMap,

          // tokenColors: mergeTextMateRules(
          //   [...(themeJson.tokenColors || [])],
          //   textMateRules || []
          // ),
          // tokenColors: [
          //   ...(themeJson.tokenColors || []),
          //   ...(textMateRules || []),
          // ],
          syntax: mergeSyntaxThemes(
            themeJson.syntax || {},
            syntaxCustomizations
          ),
        };

        // console.log(
        //   "global",
        //   JSON.stringify(themeJson.tokenColors),
        //   JSON.stringify(textMateRules),
        //   JSON.stringify(fullThemeJson.tokenColors)
        // );
        // console.log("global", JSON.stringify(scopeMap));
        this.colormaps = this.getColorUsage(fullThemeJson);
        console.log(
          "global",
          // JSON.stringify(this.colormaps)
          JSON.stringify(scopeMap),
          JSON.stringify(nameColorMap)
        );
        // console.log("global", JSON.stringify(this.colormaps));

        // Color list without transparency
        const colors: string[] = this.sortColorsByAppereances(this.colormaps);
        // console.log("**", this.colormaps);
        this._panel?.webview.postMessage({
          type: "themeChanged",
          theme: this.themeName,
          json: themeJson, // not using now
          colormaps: this.colormaps,
          colors: colors,
        });
      }
    });
  }

  /*
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
        (scope as string[]).forEach((s: any) => {
          if (result[s]) {
            result[s].override = foreground;
          } else {
            result[s] = { color: foreground };
          }
        });
      }

      if (background) {
        (scope as string[]).forEach((s: any) => {
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
  */

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

    const reactScriptPathOnDisk = vscode.Uri.joinPath(
      this._extensionUri,
      "dist/ui/",
      "webview.js"
    );

    // And the uri we use to load this script in the webview
    // const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const reactScript = webview.asWebviewUri(reactScriptPathOnDisk);

    const reactStyleResetPath = vscode.Uri.joinPath(
      this._extensionUri,
      "dist/ui",
      "webview.css"
    );

    const iconsStylePath = vscode.Uri.joinPath(
      this._extensionUri,
      "node_modules",
      "@vscode/codicons",
      "dist",
      "codicon.css"
    );

    // Uri to load styles into webview
    const reactStylesResetUri = webview.asWebviewUri(reactStyleResetPath);
    const iconStylesUri = webview.asWebviewUri(iconsStylePath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

        <!--
					Use a content security policy to only allow loading images and svg icons from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${reactStylesResetUri}" rel="stylesheet">
        <link href="${iconStylesUri}" rel="stylesheet">
        <title>${activeTheme}</title>
			</head>
			<body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="app"></div>
          <script nonce="${nonce}" type="module" src="${reactScript}"></script>
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
