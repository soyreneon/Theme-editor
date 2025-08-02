import * as vscode from "vscode";
import { parse } from "jsonc-parser";
import {
  type ThemeJson,
  type GlobalCustomizations,
  type TokenColorCustomization,
  type SimpleColorStructure,
} from "../types/";

export const getThemeJsonByName = async (
  themeName: string
): Promise<{
  themeJson: ThemeJson;
  globalCustomizations: GlobalCustomizations;
} | null> => {
  // const globalSettingsPath = vscode.Uri.file(
  //   process.platform === "darwin"
  //     ? `${process.env.HOME}/Library/Application Support/Code/User/settings.json`
  //     : `${process.env.HOME}/.config/Code/User/settings.json`
  // );
  const config = vscode.workspace.getConfiguration();
  const colorCustomizations =
    config.get<Record<string, SimpleColorStructure>>(
      "workbench.colorCustomizations"
    ) || {};

  const tokenColorCustomizations: TokenColorCustomization =
    config.get("editor.tokenColorCustomizations") || {};

  const globalCustomizations: GlobalCustomizations = {
    colors: colorCustomizations[`[${themeName}]`] || {},
    tokenColors: tokenColorCustomizations[`[${themeName}]`] || [],
  };

  // console.log("obj", JSON.stringify(obj));

  // const homeDir = process.env.HOME || process.env.USERPROFILE; // compatible en todas las plataformas

  // const globalSettingsPath = vscode.Uri.file(
  //   process.platform === "darwin"
  //     ? `${homeDir}/Library/Application Support/Code/User/settings.json`
  //     : process.platform === "win32"
  //     ? `${homeDir}\\AppData\\Roaming\\Code\\User\\settings.json`
  //     : `${homeDir}/.config/Code/User/settings.json`
  // );

  // let globalSettings: any = {};
  // try {
  //   const settingsContent = await vscode.workspace.fs.readFile(
  //     globalSettingsPath
  //   );
  //   globalSettings = parse(settingsContent.toString());
  // } catch (err) {
  //   console.error("Error reading global settings.json:", err);
  // }

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
            const themeContent = await vscode.workspace.fs.readFile(themePath);
            const decoded = Buffer.from(themeContent).toString("utf8");
            const json: ThemeJson = parse(decoded);

            return {
              themeJson: json,
              globalCustomizations,
              /*
                globalCustomizations: {
                  colors:
                    globalSettings["workbench.colorCustomizations"][
                      `[${themeName}]`
                    ] || {},
                  tokenColors:
                    globalSettings["editor.tokenColorCustomizations"][
                      `[${themeName}]`
                    ]?.textMateRules || [],
                },*/
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
};

export const getGlobalColorCustomizations = async (
  themeName: string
): Promise<Record<string, any>> => {
  const configuration = vscode.workspace.getConfiguration();
  // configuration.get<Record<string, any>>("workbench.colorCustomizations") ||
  const colorCustomizations =
    configuration.get<Record<string, any>>("workbench.colorCustomizations") ||
    {};

  // console.log(
  //   "SSS",
  //   themeName,
  //   colorCustomizations,
  //   colorCustomizations[`[${themeName}]`]
  // );
  return colorCustomizations[`[${themeName}]`] || {};
};

export const getGlobalTokenColorCustomizations = async (
  themeName: string
): Promise<TokenColorCustomization> => {
  const configuration = vscode.workspace.getConfiguration();
  const tokenColorCustomizations =
    configuration.get<TokenColorCustomization>(
      "editor.tokenColorCustomizations"
    ) || {};

  return tokenColorCustomizations[`[${themeName}]`] || {};
};

export const saveTheme = async (
  themeName: string,
  themeColorCustomizations: SimpleColorStructure | null,
  themeTokenColorCustomizations: TokenColorCustomization | null
): Promise<void> => {
  const configuration = vscode.workspace.getConfiguration();

  // override colors
  const colorCustomizations =
    configuration.get<Record<string, any>>("workbench.colorCustomizations") ||
    {};
  colorCustomizations[`[${themeName}]`] = themeColorCustomizations;

  // override tokens
  const tokenColorCustomizations =
    configuration.get<TokenColorCustomization>(
      "editor.tokenColorCustomizations"
    ) || {};
  tokenColorCustomizations[`[${themeName}]`] = themeTokenColorCustomizations;

  try {
    await configuration.update(
      "workbench.colorCustomizations",
      colorCustomizations,
      vscode.ConfigurationTarget.Global
    );
    // console.log("themeColorCustomizations", themeColorCustomizations);
    if (themeTokenColorCustomizations) {
      await configuration.update(
        "editor.tokenColorCustomizations",
        tokenColorCustomizations,
        vscode.ConfigurationTarget.Global
      );
    }
    vscode.window.showInformationMessage(
      `Updated color for ${themeName} successfully!`
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(`Failed to update color: ${error.message}`);
  }
};
