import * as vscode from "vscode";
import { parse } from "jsonc-parser";
import {
  type ThemeJson,
  type GlobalCustomizations,
  type ThemeTunerSettings,
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

  vscode.window.showWarningMessage(
    vscode.l10n.t("Theme {0} not found.", themeName)
  );
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
  const isEmpty = (obj: {}) => {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }
    return true;
  };

  const setCustomizations = (
    customizations: Record<string, any>,
    result: Record<string, any>
  ) => {
    if (isEmpty(customizations)) {
      const { [`[${themeName}]`]: _, ...rest } = result;
      return rest;
    }
    result[`[${themeName}]`] = customizations;
    return result;
  };

  // overwrite colors
  const colorCustomizations =
    configuration.get<Record<string, any>>("workbench.colorCustomizations") ||
    {};
  const finalColors = setCustomizations(
    themeColorCustomizations || {},
    colorCustomizations
  );

  // overwrite tokens
  const tokenColorCustomizations =
    configuration.get<TokenColorCustomization>(
      "editor.tokenColorCustomizations"
    ) || {};
  const finalTokens = setCustomizations(
    themeTokenColorCustomizations || {},
    tokenColorCustomizations
  );

  try {
    await configuration.update(
      "workbench.colorCustomizations",
      finalColors,
      vscode.ConfigurationTarget.Global
    );

    if (themeTokenColorCustomizations) {
      await configuration.update(
        "editor.tokenColorCustomizations",
        finalTokens,
        vscode.ConfigurationTarget.Global
      );
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(
      vscode.l10n.t("Failed to update theme {0}.", error.message)
    );
  }
};

// remove theme obj from tuner settings
export const resetTunerColorSettings = async (
  themeName: string,
  color: string
): Promise<Record<string, any> | void> => {
  const configuration = vscode.workspace.getConfiguration();
  const custom = vscode.workspace
    .getConfiguration("themeTuner")
    .get<ThemeTunerSettings>("colors");

  if (custom?.[`[${themeName}]`]) {
    const { [color]: _, ...rest } = custom[`[${themeName}]`];
    try {
      await configuration.update(
        "themeTuner.colors",
        { ...custom, [`[${themeName}]`]: rest },
        vscode.ConfigurationTarget.Global
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(
        vscode.l10n.t("Failed to update theme {0}.", error.message)
      );
    }
  }
};

// remove theme obj from tuner settings
export const resetTunerThemeSettings = async (
  themeName: string
): Promise<Record<string, any> | void> => {
  const configuration = vscode.workspace.getConfiguration();
  const custom = vscode.workspace
    .getConfiguration("themeTuner")
    .get<ThemeTunerSettings>("colors");

  if (custom?.[`[${themeName}]`]) {
    const { [`[${themeName}]`]: _, ...rest } = custom;
    try {
      await configuration.update(
        "themeTuner.colors",
        rest,
        vscode.ConfigurationTarget.Global
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(
        vscode.l10n.t("Failed to update theme {0}.", error.message)
      );
    }
  }
};

// add single color property to tuner settings
export const setTunerSetting = async (
  themeName: string,
  color: string,
  value: { name?: string; togglePinned?: boolean },
  newColor?: string
): Promise<void> => {
  const configuration = vscode.workspace.getConfiguration();
  const custom = vscode.workspace
    .getConfiguration("themeTuner")
    .get<ThemeTunerSettings>("colors");
  let customNames = custom?.[`[${themeName}]`] ?? {};
  if (newColor) {
    if (customNames[color]) {
      const { [color]: old, ...rest } = customNames;
      customNames = {
        ...rest,
        [newColor]: {
          ...old,
        },
      };
    }
  } else {
    customNames = {
      ...customNames,
      [color]: {
        ...customNames[color],
        ...(value.name && { name: value.name }),
        ...(value.togglePinned && { pinned: !customNames[color]?.pinned }),
      },
    };

    function cleanCustomNames(
      customNames: Record<string, any>
    ): Record<string, any> {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(customNames)) {
        if (value?.name || value?.pinned !== false) {
          result[key] = value;
        }
      }
      return result;
    }
    customNames = cleanCustomNames(customNames);
  }

  try {
    await configuration.update(
      "themeTuner.colors",
      { ...custom, [`[${themeName}]`]: customNames },
      vscode.ConfigurationTarget.Global
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(
      vscode.l10n.t("Failed to update color {0}: {1}", color, error.message)
    );
  }
};
