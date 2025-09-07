import * as vscode from "vscode";
import { parse } from "jsonc-parser";
import {
  type ThemeJson,
  type GlobalCustomizations,
  type ThemeTunerSettings,
  type TokenColorCustomization,
  type SemanticTokenColors,
  type CustomSemanticTokenColors,
  type SimpleColorStructure,
} from "../types/";
import { isEmpty } from "./utils";

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

  const semanticTokenColorCustomizations: CustomSemanticTokenColors =
    config.get("editor.semanticTokenColorCustomizations") || {};

  // not now
  const normalizeSemanticTokenColors = (
    semanticObject: SemanticTokenColors | undefined
  ): SemanticTokenColors | undefined => {
    if (!semanticObject) {
      return;
    }
    let result: SemanticTokenColors = {};

    for (const [key, value] of Object.entries(semanticObject)) {
      if (typeof value === "string") {
        result = { ...result, [key]: { foreground: value } };
      } else {
        result = { ...result, [key]: value };
      }
    }
    return result;
  };

  const globalCustomizations: GlobalCustomizations = {
    colors: colorCustomizations[`[${themeName}]`] || {},
    tokenColors: tokenColorCustomizations[`[${themeName}]`] || [],
    ...(semanticTokenColorCustomizations[`[${themeName}]`]?.enabled && {
      semanticHighlighting:
        semanticTokenColorCustomizations[`[${themeName}]`]?.enabled,
    }),
    ...(semanticTokenColorCustomizations[`[${themeName}]`]?.rules && {
      semanticTokenColors:
        semanticTokenColorCustomizations[`[${themeName}]`]?.rules,
    }),
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

export const getGlobalSemanticTokenColorCustomizations = async (
  themeName: string
): Promise<SemanticTokenColors> => {
  const configuration = vscode.workspace.getConfiguration();
  const semanticTokenColorCustomizations =
    configuration.get<CustomSemanticTokenColors>(
      "editor.semanticTokenColorCustomizations"
    ) || {};

  return semanticTokenColorCustomizations[`[${themeName}]`]?.rules || {};
};

export const saveTheme = async (
  themeName: string,
  themeColorCustomizations: SimpleColorStructure | null,
  themeTokenColorCustomizations: TokenColorCustomization | null,
  themeSemanticTokenColorCustomizations: SemanticTokenColors | null
): Promise<void> => {
  const configuration = vscode.workspace.getConfiguration();

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

  const setSemanticCustomizations = (
    customizations: SemanticTokenColors,
    result: CustomSemanticTokenColors
  ) => {
    return JSON.parse(
      JSON.stringify({
        ...result,
        [`[${themeName}]`]: {
          ...result[`[${themeName}]`],
          rules: customizations,
        },
      })
    );
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

  // overwrite semantic tokens
  const semanticTokenColorCustomizations =
    configuration.get<TokenColorCustomization>(
      "editor.semanticTokenColorCustomizations"
    ) || {};

  const finalSemanticTokens = setSemanticCustomizations(
    themeSemanticTokenColorCustomizations || {},
    semanticTokenColorCustomizations
  );

  // pending bug, error trying to save semantic tokens with the structure
  // *.declaration: { bold: true, foreground: "#00faff" },
  // only with objects, but hardcoded objects works
  // const test = {
  //   "[Cobalt2]": {
  //     enabled: false,
  //     rules: {
  //       "*.declaration": { bold: true, foreground: "#00faff" },
  //       variable: {
  //         bold: true,
  //         foreground: "#fdf",
  //       },
  //       function: {
  //         foreground: "#c1e60f",
  //       },
  //     },
  //   },
  // };

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
    await configuration.update(
      "editor.semanticTokenColorCustomizations",
      finalSemanticTokens,
      vscode.ConfigurationTarget.Global
    );
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
    if (customNames[color] && customNames[newColor]) {
      const { [color]: old, [newColor]: existingColor, ...rest } = customNames;
      customNames = {
        ...rest,
        [newColor]: {
          ...old,
          ...(existingColor.name && {
            name: `${existingColor.name} ${old.name}`,
          }),
          ...((existingColor.pinned || old.pinned) && {
            pinned: true,
          }),
        },
      };
    } else if (customNames[color]) {
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
    let newSettings: ThemeTunerSettings = {};
    if (isEmpty(customNames)) {
      for (const [key, value] of Object.entries(custom ?? {})) {
        if (key !== `[${themeName}]`) {
          newSettings[key] = value;
        }
      }
    } else {
      newSettings = {
        ...custom,
        [`[${themeName}]`]: customNames,
      };
    }

    await configuration.update(
      "themeTuner.colors",
      newSettings,
      vscode.ConfigurationTarget.Global
    );
  } catch (error: any) {
    vscode.window.showErrorMessage(
      vscode.l10n.t("Failed to update color {0}: {1}", color, error.message)
    );
  }
};
