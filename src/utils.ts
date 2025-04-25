import * as vscode from "vscode";
import { parse } from "jsonc-parser";
import {
  type ThemeJson,
  type GlobalCustomizations,
  type TokenColorCustomization,
  type TextMateRule,
  type TokenColor,
  type SimpleColorStructure,
  type ScopeMap,
} from "../types/";

export const updateColor = () => {};

export const updateTokenColorCustomization = (
  themeTokenColorCustomizations: TokenColorCustomization,
  settingsTokenKeys: TokenColor,
  previousColor: string,
  newColor: string
): TokenColorCustomization => {
  const updatedRules: TextMateRule[] = [];
  let merged = false;

  (themeTokenColorCustomizations?.textMateRules as TextMateRule[]).forEach(
    (rule) => {
      const currentTypeColor = rule.settings[settingsTokenKeys.type];
      const ruleScopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];

      // Si la regla tiene el color anterior y alguno de los scopes, la eliminamos
      const hasMatchingScope = settingsTokenKeys.scope.some((s) =>
        ruleScopes.includes(s)
      );

      console.log(
        "** before",
        hasMatchingScope,
        currentTypeColor,
        previousColor,
        newColor
      );

      if (
        hasMatchingScope &&
        currentTypeColor &&
        currentTypeColor.toLowerCase() === previousColor.toLowerCase()
      ) {
        console.log("** skip");
        return; // skip (i.e., "remove" this rule)
      }

      // Si tiene el mismo color nuevo, añadimos los nuevos scopes
      if (
        currentTypeColor &&
        currentTypeColor.toLowerCase() === newColor.toLowerCase()
      ) {
        console.log("** new");

        const mergedScopes = Array.from(
          new Set([...ruleScopes, ...settingsTokenKeys.scope])
        );
        updatedRules.push({
          ...rule,
          scope: mergedScopes,
        });
        merged = true;
        return;
      }

      updatedRules.push(rule);
    }
  );

  // Si no se encontró ninguna coincidencia con el nuevo color, se crea una nueva regla
  if (!merged) {
    updatedRules.push({
      name: `Updated ${settingsTokenKeys.type} color`,
      scope: settingsTokenKeys.scope,
      settings: {
        [settingsTokenKeys.type]: newColor,
      },
    });
  }

  return {
    textMateRules: updatedRules,
  };
};

// Helper function to normalize color to 6-digit hex without alpha and uppercase
export const normalizeColor = (color: string): string => {
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  } else if (color.length === 5) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  } else if (color.length === 9) {
    return color.substring(0, 7).toUpperCase();
  }
  return color.toUpperCase();
};

// get alpha chanel in color code
export const getAlpha = (color: string): string | null => {
  if (color.length === 5) {
    return `${color[4]}${color[4]}`.toUpperCase();
  } else if (color.length === 9) {
    return color.substring(7, 9).toUpperCase();
  }
  return null;
};

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

export const mergeSyntaxThemes = (
  syntax1: SimpleColorStructure,
  syntax2: SimpleColorStructure
) => {
  const result: SimpleColorStructure = {};

  const expandAndAssign = (source: SimpleColorStructure) => {
    for (const [key, value] of Object.entries(source)) {
      const keys = key.split(",").map((k) => k.trim());
      for (const singleKey of keys) {
        result[singleKey] = value;
      }
    }
  };

  expandAndAssign(syntax1);
  expandAndAssign(syntax2); // overwite if exists

  return result;
};

/*
export const mergeTextMateRules = (
  mateRules1: TextMateRule[],
  mateRules2: TextMateRule[]
): TextMateRule[] => {
  const result: TextMateRule[] = [];

  // Clonar para no mutar los originales
  // const allRules = [...mateRules1];
  const allRules = mateRules1.map((rule) => ({
    name: rule.name,
    scope: Array.isArray(rule.scope) ? [...rule.scope] : rule.scope,
    settings: { ...rule.settings },
  }));

  // Mapeo para acceder rápido por color y tipo
  const scopeMap = new Map<string, TextMateRule>();

  const getKey = (scope: string, type: "foreground" | "background") =>
    `${type}:${scope}`;

  // Indexar reglas existentes
  for (const rule of allRules) {
    if (!rule.scope) {
      continue;
    }

    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    const types: ("foreground" | "background")[] = [];

    if (rule.settings.foreground) {
      types.push("foreground");
    }
    if (rule.settings.background) {
      types.push("background");
    }

    for (const scope of scopes) {
      for (const type of types) {
        const key = getKey(scope, type);
        scopeMap.set(key, rule);
      }
    }
  }

  for (const newRule of mateRules2) {
    // Reglas globales (sin scope ni name)
    if (!newRule.scope && !newRule.name) {
      result.push(newRule);
      continue;
    }

    const scopes = Array.isArray(newRule.scope)
      ? newRule.scope
      : [newRule.scope];
    const types: ("foreground" | "background")[] = [];

    if (newRule.settings.foreground) types.push("foreground");
    if (newRule.settings.background) types.push("background");

    let matched = false;

    for (const scope of scopes) {
      for (const type of types) {
        const key = getKey(scope, type);
        const existing = scopeMap.get(key);

        if (existing) {
          matched = true;
          // Actualizar el color del tipo correspondiente
          existing.settings[type] = newRule.settings[type];

          // Agregar nuevos scopes si vienen con nombre diferente
          if (newRule.name && existing.name !== newRule.name) {
            existing.name = newRule.name;
          }

          const existingScopes = new Set(
            Array.isArray(existing.scope) ? existing.scope : [existing.scope]
          );
          existingScopes.add(scope);
          existing.scope = Array.from(existingScopes);
        } else {
          // Si no hay coincidencia, agregar la regla
          scopeMap.set(key, newRule);
        }
      }
    }

    // Si no hizo match con nadie, agregarla como nueva
    if (!matched) {
      for (const scope of scopes) {
        for (const type of types) {
          const key = getKey(scope, type);
          scopeMap.set(key, newRule);
        }
      }
    }
  }

  // Asegurarnos de agregar las reglas indexadas (únicas o combinadas)
  const seen = new Set<TextMateRule>();
  for (const rule of scopeMap.values()) {
    if (!seen.has(rule)) {
      seen.add(rule);
      result.push(rule);
    }
  }

  return result;
};
*/

export const mapTextMateRules = (
  mateRules1: TextMateRule[],
  mateRules2: TextMateRule[]
): {
  scopeMap: ScopeMap;
  nameColorMap: SimpleColorStructure;
} => {
  const scopeMap: ScopeMap = {};
  const nameColorMap: SimpleColorStructure = {};

  const processRules = (rules: TextMateRule[]) => {
    for (const rule of rules) {
      const { scope, settings, name } = rule;

      // Handle global settings (no scope)
      if (!scope) {
        scopeMap["global"] = {
          ...scopeMap["global"],
          ...(settings.foreground && { foreground: settings.foreground }),
          ...(settings.background && { background: settings.background }),
        };
        continue;
      }

      // Normalize scope to an array
      const scopes = Array.isArray(scope) ? scope : [scope];
      for (const singleScope of scopes) {
        scopeMap[singleScope] = {
          ...scopeMap[singleScope],
          ...(settings.foreground && { foreground: settings.foreground }),
          ...(settings.background && { background: settings.background }),
        };
      }

      // Map name to color
      if (name && settings.foreground) {
        nameColorMap[name] = settings.foreground;
      } else if (settings.foreground) {
        nameColorMap[settings.foreground] = settings.foreground;
      }
    }
  };

  // Process both rule sets, with mateRules2 overriding mateRules1
  processRules(mateRules1);
  processRules(mateRules2);

  return { scopeMap, nameColorMap };
};
