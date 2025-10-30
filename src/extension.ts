import * as vscode from "vscode";
import {
  type ThemeJson,
  type FullThemeJson,
  type ColorMap,
  type Group,
  type PropertyColor,
  type SimpleColorStructure,
} from "../types";
import {
  mergeSyntaxThemes,
  mergeSemanticTokens,
  mapTextMateRules,
  getAlphaProps,
  getCustomColors,
  getColorUsage,
  buildPropertyColorCustomizations,
  buildPropertyTokenColorCustomizations,
  buildPropertySyntaxColorCustomizations,
  buildPropertySemanticTokenColorCustomizations,
  buildColorCustomizations,
  buildTokenColorCustomizations,
  buildSyntaxColorCustomizations,
  buildSemanticTokenColorCustomizations,
  removeColorCustomizations,
  removeTokenColorCustomizations,
  removeSyntaxColorCustomizations,
  removeSemanticTokenColorCustomizations,
  sortColorsByAppereances,
  invertColorMapping,
  tokenColorMapToTextMateRules,
} from "./utils";
import {
  getThemeJsonByName,
  getGlobalColorCustomizations,
  getGlobalTokenColorCustomizations,
  getGlobalSemanticTokenColorCustomizations,
  resetTunerColorSettings,
  resetTunerThemeSettings,
  saveTheme,
  setTunerSetting,
} from "./themeUtils";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Extension "themeTuner" now active!');

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

  context.subscriptions.push(
    vscode.commands.registerCommand("themeeditor.openThemeEditor", () => {
      ThemeEditorPanel.createOrShow(context.extensionUri);
    })
  );

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
      // vscode.Uri.joinPath(extensionUri, "media", "codicons"),
      vscode.Uri.joinPath(extensionUri, "dist"),
      // vscode.Uri.joinPath(
      //   extensionUri,
      //   "node_modules",
      //   "@vscode/codicons",
      //   "dist"
      // ),
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
    semanticTokenColorsMap: {},
  };
  private alphaColors: SimpleColorStructure[] = [];
  private themeObj: ThemeJson = {
    name: "",
    type: "",
    colors: {},
    tokenColors: [],
    syntax: {},
  };
  private themeName: string = "";
  // private firstLoad: boolean = true;
  // private globalSettings: GlobalCustomizations = {
  //   colors: {},
  //   tokenColors: {},
  // };

  public static createOrShow(extensionUri: vscode.Uri) {
    // open only in one column
    // const column = vscode.window.activeTextEditor
    //   ? vscode.window.activeTextEditor.viewColumn
    //   : undefined;
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Two
      : undefined;
    // Always open in the second column
    // const column = vscode.ViewColumn.Two;

    // If we already have a panel, show it.
    if (ThemeEditorPanel.currentPanel) {
      ThemeEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ThemeEditorPanel.viewType,
      "ThemeTuner",
      column || vscode.ViewColumn.One,
      // column,
      getWebviewOptions(extensionUri)
    );

    panel.iconPath = {
      light: vscode.Uri.joinPath(extensionUri, "media", "icon-light.png"),
      dark: vscode.Uri.joinPath(extensionUri, "media", "icon-dark.png"),
    };

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

    // We might not need this
    // Update the content based on view changes (tab switching, etc.)
    // this._panel.onDidChangeViewState(
    //   () => {
    //     if (this._panel.visible) {
    //       this.loadCurrentTheme();
    //     }
    //   },
    //   null,
    //   this._disposables
    // );

    // on switching theme
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("workbench.colorTheme")) {
        this._panel?.webview.postMessage({
          type: "refresh",
          loading: true,
        });
        this.loadCurrentTheme();
      }
    });

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "ui-ready":
            // if (this.firstLoad) {
            //   this.firstLoad = false;
            //   return;
            // }
            const translations: Record<string, string> = {};
            message.captions.map(
              (c: string) => (translations[c] = vscode.l10n.t(c))
            );

            this._panel?.webview.postMessage({
              type: "language",
              // language: vscode.env.language,
              translations,
            });
            this.loadCurrentTheme();
            return;
          case "save":
            // new method: get older color, search on this.colormaps and replace to the new color on settings
            // if it's already in the original theme do nothing, if not add it or change it
            this.updateColor(message.old, message.color, message.applyTo).then(
              async () => {
                if (message.isFullChange) {
                  await setTunerSetting(
                    this.themeName,
                    message.old,
                    {},
                    message.color
                  );
                }
                this.loadCurrentTheme(vscode.l10n.t("Color updated"));
              }
            );
            return;
          case "singleProp":
            console.log("**", message.property, message.color, message.applyTo);
            this.updatePropertyList(
              [{ property: message.property, color: message.color }],
              message.applyTo
            ).then(async () => {
              // if (message.isFullChange) {
              //   await setTunerSetting(
              //     this.themeName,
              //     message.old,
              //     {},
              //     message.color
              //   );
              // }
              this.loadCurrentTheme(vscode.l10n.t("Color updated"));
            });
            // this.loadCurrentTheme(vscode.l10n.t("Property updated"));

            return;
          case "colorName":
            setTunerSetting(this.themeName, message.color, {
              name: message.name,
            }).then(() => {
              this.loadCurrentTheme(vscode.l10n.t("Name updated"));
            });
            return;
          case "togglePin":
            setTunerSetting(this.themeName, message.color, {
              togglePinned: true,
            }).then(() =>
              this.loadCurrentTheme(vscode.l10n.t("Change applied"))
            );
            return;
          // reset color
          case "reset":
            this.resetColor(message.color, message.applyTo).then(async () => {
              await resetTunerColorSettings(this.themeName, message.color);
              this.loadCurrentTheme(
                vscode.l10n.t("Color {0} reset", message.color)
              );
            });
            return;
          case "resetTheme":
            this.resetThemeColor().then(async () => {
              await resetTunerThemeSettings(this.themeName);
              this.loadCurrentTheme(vscode.l10n.t("Theme reset succesfully"));
              // vscode.window.showInformationMessage(
              //   vscode.l10n.t("Theme reset succesfully")
              // );
            });
            return;
          case "refreshTheme":
            this.loadCurrentTheme();
            this._panel?.webview.postMessage({
              type: "refresh",
              loading: false,
            });
            return;
          case "exportTheme":
            vscode.commands.executeCommand(
              "workbench.action.generateColorTheme"
            );
            return;
        }
      },
      null,
      this._disposables
    );
  }

  /*
   *
   * Reset theme
   */
  public resetThemeColor = async () => {
    // const applyTo: Group = {
    //   colors: false,
    //   tokenColors: false,
    //   semanticTokenColors: false,
    //   syntax: false,
    // };
    await saveTheme(this.themeName, {}, {}, {});
    // await saveTheme(this.themeName, {}, {}, {}, applyTo);
  };

  /*
   *
   * Reset single color in the theme
   */
  public resetColor = async (color: string, applyTo: Group) => {
    // get custom values from settings
    let colorCustomizations = null;
    if (applyTo.colors) {
      const themeColorCustomizations = await getGlobalColorCustomizations(
        this.themeName
      );
      //remove color from colors
      colorCustomizations = removeColorCustomizations(
        themeColorCustomizations,
        color
      );
    }

    let tokenColorCustomizations = null;
    if (applyTo.tokenColors || applyTo.syntax) {
      const themeTokenColorCustomizations =
        await getGlobalTokenColorCustomizations(this.themeName);

      //remove colors from syntax
      let syntaxCustomizations = null;
      if (applyTo.syntax) {
        syntaxCustomizations = removeSyntaxColorCustomizations(
          themeTokenColorCustomizations,
          color
        );
      }

      //remove color from tokens
      tokenColorCustomizations = {
        ...removeTokenColorCustomizations(themeTokenColorCustomizations, color),
        ...syntaxCustomizations,
      };
    }

    let semanticTokenColorCustomizations = null;
    if (applyTo.semanticTokenColors) {
      const themeSemanticTokenColorCustomizations =
        await getGlobalSemanticTokenColorCustomizations(this.themeName);

      //remove color from semantic tokens
      semanticTokenColorCustomizations = removeSemanticTokenColorCustomizations(
        themeSemanticTokenColorCustomizations,
        color
      );
    }

    await saveTheme(
      this.themeName,
      colorCustomizations,
      tokenColorCustomizations,
      semanticTokenColorCustomizations,
      applyTo
    );
  };

  /*
   *
   * Update color in the theme
   */
  public updateColor = async (
    previousColor: string,
    newColor: string,
    applyTo: Group
  ) => {
    // final colors object
    let colorCustomizations = null;
    if (applyTo.colors) {
      // get custom values from settings
      const themeColorCustomizations = await getGlobalColorCustomizations(
        this.themeName
      );
      const settingsColorKeys = this.colormaps.colorsMap[previousColor] || [];
      colorCustomizations = buildColorCustomizations(
        settingsColorKeys,
        themeColorCustomizations,
        newColor,
        this.themeObj.colors
      );
    }

    // let themeTokenColorCustomizations = null;
    // if (applyTo.syntax || applyTo.tokenColors) {
    //   themeTokenColorCustomizations = await getGlobalTokenColorCustomizations(
    //     this.themeName
    //   );
    // }

    // final syntax colors object
    let syntaxColorCustomizations = null;
    if (applyTo.syntax) {
      const settingsSyntaxKeys = this.colormaps.syntaxMap[previousColor] || [];
      const themeTokenColorCustomizations =
        await getGlobalTokenColorCustomizations(this.themeName);

      syntaxColorCustomizations = buildSyntaxColorCustomizations(
        settingsSyntaxKeys,
        themeTokenColorCustomizations,
        newColor
      );
    }

    // final token colors object
    let tokenColorCustomizations = null;
    if (applyTo.tokenColors || applyTo.syntax) {
      const settingsTokenKeys =
        this.colormaps.tokenColorsMap[previousColor] || {};
      const themeTokenColorCustomizations =
        await getGlobalTokenColorCustomizations(this.themeName);

      // if (applyTo.syntax && !applyTo.tokenColors){
      // tokenColorCustomizations = {
      //   ...themeTokenColorCustomizations,
      //   ...syntaxColorCustomizations,
      // };
      // }
      tokenColorCustomizations = {
        ...buildTokenColorCustomizations(
          settingsTokenKeys,
          themeTokenColorCustomizations,
          newColor
        ),
        // adding syntax colors
        ...(syntaxColorCustomizations || {}),
      };
    }

    // final semantic token colors object
    let semanticTokenColorCustomizations = null;
    if (applyTo.semanticTokenColors) {
      const themeSemanticTokenColorCustomizations =
        await getGlobalSemanticTokenColorCustomizations(this.themeName);
      // semantic tokens
      const settingsSemanticTokenKeys =
        this.colormaps.semanticTokenColorsMap[previousColor] || [];
      semanticTokenColorCustomizations = buildSemanticTokenColorCustomizations(
        settingsSemanticTokenKeys,
        themeSemanticTokenColorCustomizations,
        newColor
      );
    }

    // return;
    await saveTheme(
      this.themeName,
      // themeColorCustomizations,
      colorCustomizations,
      tokenColorCustomizations,
      semanticTokenColorCustomizations,
      applyTo
    );
  };

  /*
   *
   * Update color array in the theme
   */
  public updatePropertyList = async (
    propertyColors: PropertyColor[],
    applyTo: Group
  ) => {
    // final colors object
    let colorCustomizations = null;
    if (applyTo.colors) {
      // get custom values from settings
      const themeColorCustomizations = await getGlobalColorCustomizations(
        this.themeName
      );
      // const settingsColorKeys = this.colormaps.colorsMap[previousColor] || [];
      colorCustomizations = buildPropertyColorCustomizations(
        propertyColors,
        themeColorCustomizations
      );
    }

    // delete later
    // let syntaxColorCustomizations = null;
    // let tokenColorCustomizations = null;
    // let semanticTokenColorCustomizations = null;

    // final syntax colors object
    let syntaxColorCustomizations = null;
    if (applyTo.syntax) {
      // const settingsSyntaxKeys = this.colormaps.syntaxMap[previousColor] || [];
      const themeTokenColorCustomizations =
        await getGlobalTokenColorCustomizations(this.themeName);

      syntaxColorCustomizations = buildPropertySyntaxColorCustomizations(
        // settingsSyntaxKeys,
        themeTokenColorCustomizations,
        propertyColors
      );
    }

    // final token colors object
    // {
    //   "scope": ["entity.name.type.interface", "keyword.other.platform.os.swift"],
    //   "type": "foreground"
    // }
    // console.log(
    //   "syntaxColorCustomizations",
    //   JSON.stringify(syntaxColorCustomizations)
    // );
    let tokenColorCustomizations = null;
    if (applyTo.tokenColors || applyTo.syntax) {
      // const settingsTokenKeys = {};
      // const settingsTokenKeys =
      //   this.colormaps.tokenColorsMap[previousColor] || {};
      const themeTokenColorCustomizations =
        await getGlobalTokenColorCustomizations(this.themeName);

      tokenColorCustomizations = {
        ...buildPropertyTokenColorCustomizations(
          propertyColors,
          themeTokenColorCustomizations
          // newColor
        ),
        // adding syntax colors
        ...(syntaxColorCustomizations || {}),
      };
      // console.log(
      //   "in tokenColorCustomizations",
      //   JSON.stringify(tokenColorCustomizations)
      // );
    }

    // final semantic token colors object
    let semanticTokenColorCustomizations = null;
    if (applyTo.semanticTokenColors) {
      const themeSemanticTokenColorCustomizations =
        await getGlobalSemanticTokenColorCustomizations(this.themeName);
      semanticTokenColorCustomizations =
        buildPropertySemanticTokenColorCustomizations(
          propertyColors,
          themeSemanticTokenColorCustomizations
        );
    }

    await saveTheme(
      this.themeName,
      colorCustomizations,
      tokenColorCustomizations,
      semanticTokenColorCustomizations,
      applyTo
    );
  };

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

  private loadCurrentTheme(message?: string): void {
    this.themeName =
      vscode.workspace
        .getConfiguration("workbench")
        .get<string>("colorTheme") ?? "";
    const custom = vscode.workspace
      .getConfiguration("themeTuner")
      .get<Record<string, any>>("colors");
    const customNames = custom?.[`[${this.themeName}]`];

    getThemeJsonByName(this.themeName as string).then((result) => {
      if (result) {
        try {
          const { themeJson, globalCustomizations } = result;
          this.themeObj = themeJson;
          // ? has alpha chanel
          // console.log(JSON.stringify(this.themeObj.colors));
          // this.globalSettings = globalCustomizations;
          const customColorList = getCustomColors(globalCustomizations);

          const { textMateRules, ...syntaxCustomizations } =
            globalCustomizations.tokenColors ?? {}; // here

          const { scopeMap } = mapTextMateRules(
            themeJson.tokenColors || [],
            textMateRules || [],
            true // toggle this until I test it
          );

          const fullThemeJson: FullThemeJson = {
            ...themeJson,
            colors: {
              ...themeJson.colors,
              ...globalCustomizations.colors, // get here custom color list
            },
            tokenColors: scopeMap,
            syntax: mergeSyntaxThemes(
              themeJson.syntax || {},
              syntaxCustomizations
            ),
            semanticTokenColors: mergeSemanticTokens(
              themeJson.semanticTokenColors || {},
              globalCustomizations.semanticTokenColors || {}
            ),
          };

          this.alphaColors = getAlphaProps(fullThemeJson.colors);
          this.colormaps = getColorUsage(fullThemeJson);

          // Color list without transparency
          const colors = sortColorsByAppereances(this.colormaps);
          // console.log(
          //   JSON.stringify(colors) // color list ordered by appearences
          // );

          // const colors: string[] = sortColorsByAppereances(this.colormaps);
          // console.log(
          // "**",
          // JSON.stringify(colors), // color list ordered by appearences
          // JSON.stringify(this.colormaps) // map by group
          // JSON.stringify(customColorList) // overrides
          // );
          // console.log("themeobj ", JSON.stringify(this.themeObj.type));
          /*
          console.log(
            "tobj ",
            fullThemeJson.tokenColors &&
              JSON.stringify(
                tokenColorMapToTextMateRules(fullThemeJson.tokenColors)
              ), // good
            JSON.stringify(invertColorMapping(this.colormaps.colorsMap)), // good
            JSON.stringify(fullThemeJson.syntax), // good
            JSON.stringify(fullThemeJson.semanticTokenColors) // good
          );
           */

          this._panel?.webview.postMessage({
            type: "themeChanged",
            themeType: this.themeObj.type,
            theme: this.themeName,
            exportObj: {
              tokenColors: tokenColorMapToTextMateRules(
                fullThemeJson.tokenColors || {}
              ),
              // )?.textMateRules,
              colors: invertColorMapping(this.colormaps.colorsMap),
              syntax: fullThemeJson.syntax,
              semanticTokens: fullThemeJson.semanticTokenColors,
            },
            // json: themeJson, // not using now
            colormaps: this.colormaps,
            alphaColors: this.alphaColors,
            customColorList: customColorList,
            colors,
            // colors: colors,
            error: "",
            tunerSettings: customNames,
            ...(message && { message }),
          });
          // try {
        } catch (error) {
          this._panel?.webview.postMessage({
            type: "error",
            error: vscode.l10n.t(
              `Couldn't read {0} or its customizations, check you settings.json for some issues or maybe this theme has invalid data`,
              this.themeName
            ),
          });
        }
      }
    });
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    // let all = await vscode.workspace.getConfiguration();
    const workSpaceConfig = vscode.workspace.getConfiguration("workbench");
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
      "media",
      "codicons",
      "codicon.css"
    );
    // const iconsStylePath = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   "node_modules",
    //   "@vscode/codicons",
    //   "dist",
    //   "codicon.css"
    // );

    // Uri to load styles into webview
    const reactStylesResetUri = webview.asWebviewUri(reactStyleResetPath);
    const iconStylesUri = webview.asWebviewUri(iconsStylePath);

    const alphaUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "alpha.png")
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
        <style>
          :root {
            --alpha-uri: url('${alphaUri}');
          }
        </style>
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
