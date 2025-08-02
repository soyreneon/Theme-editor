import { json } from "stream/consumers";
import {
  // type ThemeJson,
  // type GlobalCustomizations,
  type TokenColorMap,
  type ColorStructure,
  // type SyntaxMap,
  type FullThemeJson,
  type TokenColorCustomization,
  type TextMateRule,
  type TokenColor,
  type Settings,
  type SimpleColorStructure,
  type ScopeMap,
} from "../types/";

export const updateColor = () => {};

// ? possibly deprecated
export const updateTokenColorCustomization = (
  themeTokenColorCustomizations: TokenColorCustomization,
  settingsTokenKeys: TokenColor,
  previousColor: string,
  newColor: string
): TokenColorCustomization => {
  // revisar esto
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

// Helper function to normalize color to 6-digit hex without alpha and lowercase
export const normalizeColor = (color: string): string => {
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  } else if (color.length === 5) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  } else if (color.length === 9) {
    return color.substring(0, 7).toLowerCase();
  }
  return color.toLowerCase();
};

// get alpha chanel in color code
export const getAlpha = (color: string): string => {
  if (color.length === 5) {
    return `${color[4]}`.toUpperCase();
    // return `${color[4]}${color[4]}`.toUpperCase();
  } else if (color.length === 9) {
    return color.substring(7, 9).toUpperCase();
  }
  return "";
};

/*
 * Build colors
 */
export const buildColorCustomizations = (
  colorKeys: string[],
  themeColorCustomizations: Record<string, any>,
  color: string,
  themeObjColors?: SimpleColorStructure
): SimpleColorStructure => {
  // console.log(
  //   "*** colorCustomizations1",
  //   JSON.stringify(themeColorCustomizations)
  // );
  // console.log("*** hola", settingsColorKeys);
  //recorro cada prop (e.g. terminal.ansiCyan, etc)
  // generate new colors
  colorKeys.forEach((setting) => {
    // console.log("*** setting", setting);
    /*
      let alpha = "";
      // la prop ya existe en settings
      if (themeColorCustomizations[setting]) {
        alpha = getAlpha(themeColorCustomizations[setting]);
        // la obtengo del tema
      } else if (this.themeObj.colors?.[setting]) {
        alpha = getAlpha(this.themeObj.colors?.[setting]);
      }
      */
    const currentColor =
      themeColorCustomizations[setting] ?? themeObjColors?.[setting];
    const alpha = getAlpha(currentColor);

    // debig color nomalized to save it , try with override or not
    // console.log("###COLR", currentColor, normalizeColor(newColor), alpha);
    themeColorCustomizations[setting] = `${normalizeColor(color)}${alpha}`;

    // console.log(
    //   "alpha",
    //   alpha,
    //   normalizeColor(`${newColor}`),
    //   normalizeColor(this.themeObj.colors?.[setting] || ""),
    //   normalizeColor(this.themeObj.colors?.[setting] || "") ===
    //     normalizeColor(newColor)
    // );
    /*
      if (
        themeColorCustomizations[setting] &&
        normalizeColor(this.themeObj.colors?.[setting] || "") !==
          normalizeColor(newColor)
      ) {
        console.log("hola pero");
        const key = this.themeObj.colors?.[setting] as string;
        const { [key]: extracted, ...rest } = themeColorCustomizations[setting];
        themeColorCustomizations[setting] = rest;
      } else if (
        normalizeColor(this.themeObj.colors?.[setting] || "") ===
        normalizeColor(newColor)
      ) {
        console.log("hola gato");
        themeColorCustomizations[setting] = `${newColor}${alpha}`;
      }
      */
  });
  return themeColorCustomizations;
};

export const buildTokenColorCustomizations = (
  tokenKeys: TokenColor, // new keys to add on settings.json
  themeTokenColorCustomizations: TokenColorCustomization, // settingsTokenKeys from settings.json
  color: string // new color
  // themeObjTokenColors?: TextMateRule[] // from theme.json (to remove redundant colors)
): TokenColorCustomization | null => {
  // ): Record<string, any> => {
  const { scopeMap } = mapTextMateRules(
    themeTokenColorCustomizations.textMateRules as TextMateRule[],
    // themeObjTokenColors as TextMateRule[]
    [{ scope: tokenKeys.scope, settings: { [tokenKeys.type]: color } }],
    true
  );
  /*
   * token section
   */
  // Object.keys(settingsTokenKeys.scope).forEach((setting) => {
  // tokenKeys.scope.forEach((setting) => {
  //   console.log(setting);
  //   themeTokenColorCustomizations;
  // });

  return compactTokenColorParse(scopeMap);
  // return themeTokenColorCustomizations;
};

export const buildSyntaxColorCustomizations = (
  syntaxKeys: string[], // new keys to add on settings.json
  themeTokenColorCustomizations: TokenColorCustomization, // settingsTokenKeys from settings.json
  color: string // new color
  // themeObjSyntaxColors?: SimpleColorStructure // from theme.json (to remove redundant colors)
): SimpleColorStructure | null => {
  const { textMateRules, ...customSyntax } = themeTokenColorCustomizations;
  syntaxKeys = syntaxKeys.reduce(
    (acc: string[], current) =>
      (acc = [...acc, ...current.split(",").map((x) => x.trim())]),
    []
  );
  const newSyntax: SimpleColorStructure = Object.fromEntries(
    syntaxKeys.map((x) => [x, color])
  );

  const result: SimpleColorStructure = {};

  // divide keys if they are compunded
  for (const [compoundKey, color] of Object.entries(customSyntax)) {
    const keys = compoundKey.split(",").map((k) => k.trim());
    for (const key of keys) {
      result[key] = color;
    }
  }

  // override
  for (const [key, overrideColor] of Object.entries(newSyntax)) {
    result[key] = overrideColor;
  }

  // console.log("#$%", JSON.stringify(result));
  return result;
};

/*
 * Reset colors
 */
export const removeColorCustomizations = (
  colorKeys: SimpleColorStructure,
  color: string
): SimpleColorStructure | null => {
  const newColorKeys: SimpleColorStructure = {};

  for (const [key, value] of Object.entries(colorKeys)) {
    if (normalizeColor(value) !== normalizeColor(color)) {
      newColorKeys[key] = value;
    }
  }
  return newColorKeys;
};

export const removeTokenColorCustomizations = (
  tokenKeys: TokenColorCustomization, // new keys to add on settings.json
  // tokenKeys: TokenColor, // new keys to add on settings.json
  // themeTokenColorCustomizations: TokenColorCustomization, // settingsTokenKeys from settings.json
  color: string // new color
  // themeObjTokenColors?: TextMateRule[] // from theme.json (to remove redundant colors)
): TokenColorCustomization | null => {
  // console.log("#$%", JSON.stringify(tokenKeys));
  // ): Record<string, any> => {
  const { scopeMap } = mapTextMateRules(
    tokenKeys.textMateRules as TextMateRule[],
    // themeObjTokenColors as TextMateRule[]
    [],
    true
  );

  const result: ScopeMap = {};
  for (const [key, settings] of Object.entries(scopeMap)) {
    // Copiamos solo las entradas que no coinciden con `val`
    const filtered = Object.fromEntries(
      Object.entries(settings).filter(([key, currentcolor]) =>
        key === "foreground" || key === "background"
          ? normalizeColor(currentcolor) !== normalizeColor(color)
          : true
      )
    );

    // If is not empty, we add it
    if (Object.keys(filtered).length > 0) {
      result[key] = filtered;
    }
  }
  // console.log(
  //   "*****",
  //   JSON.stringify(result)
  //   // JSON.stringify(compactTokenColorParse(scopeMap))
  //   // JSON.stringify(themeTokenColorCustomizations)
  // );
  return compactTokenColorParse(result);
  // return null;
};

export const removeSyntaxColorCustomizations = (
  tokenKeys: TokenColorCustomization,
  color: string
): SimpleColorStructure | null => {
  const { textMateRules, ...customSyntax } = tokenKeys;

  const result: SimpleColorStructure = {};
  for (const [key, currentcolor] of Object.entries(customSyntax)) {
    if (normalizeColor(currentcolor) !== normalizeColor(color)) {
      result[key] = currentcolor;
    }
  }

  return result;
};

/*
 *
 */
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
  mateRules2: TextMateRule[],
  addExtraSettings?: boolean
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
        const { foreground, background, ...restSettings } = settings;
        scopeMap[singleScope] = {
          ...scopeMap[singleScope],
          ...(settings.foreground && { foreground: settings.foreground }),
          ...(settings.background && { background: settings.background }),
          ...(addExtraSettings && restSettings),
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
  // console.log("WW***");
  // console.log("WW*** process", JSON.stringify(mateRules1));
  // console.log("WW***");
  // console.log(JSON.stringify(mateRules2));
  mateRules1 && processRules(mateRules1);
  mateRules2 && processRules(mateRules2);
  // console.log("on here");
  // console.log(JSON.stringify(nameColorMap));
  return { scopeMap, nameColorMap };
};

/*
 * getColorUsage()
 * Extract theme into a more readable and processable object
 * getColorUsage is the main function
 */
const getColorsMap = (themeColors?: SimpleColorStructure): ColorStructure => {
  const colorsMap: ColorStructure = {};
  for (const [property, value] of Object.entries(themeColors ?? {})) {
    const normalizedColor = normalizeColor(value);
    if (!colorsMap[normalizedColor]) {
      colorsMap[normalizedColor] = [];
    }
    colorsMap[normalizedColor].push(property);
  }
  return colorsMap;
};

const getTokenColorsMap = (
  themeTokenColors?: ScopeMap,
  addExtraSettings?: boolean
): TokenColorMap => {
  const tokenColorsMap: TokenColorMap = {};
  // console.log(JSON.stringify(themeTokenColors));

  for (const [scope, tokenData] of Object.entries(themeTokenColors ?? {})) {
    const { foreground, background, ...restSettings } = tokenData;

    if (foreground) {
      const normalizedForeground = normalizeColor(foreground);
      if (!tokenColorsMap[normalizedForeground]) {
        tokenColorsMap[normalizedForeground] = {
          scope: [],
          type: "foreground",
          ...(addExtraSettings ? restSettings : {}),
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
          ...(addExtraSettings ? restSettings : {}),
        };
      }
      tokenColorsMap[normalizedBackground].scope.push(scope);
    }
  }

  return tokenColorsMap;
};

const getSyntaxMap = (themeSyntax?: SimpleColorStructure): ColorStructure => {
  const syntaxMap: ColorStructure = {};

  const processedSyntax = new Set<string>();
  for (const [categories, color] of Object.entries(themeSyntax ?? {})) {
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
  return syntaxMap;
};

export const getColorUsage = (
  theme: FullThemeJson
): {
  colorsMap: ColorStructure;
  tokenColorsMap: TokenColorMap;
  syntaxMap: ColorStructure;
} => {
  const colorsMap = getColorsMap(theme.colors);
  const tokenColorsMap = getTokenColorsMap(theme.tokenColors);
  const syntaxMap = getSyntaxMap(theme.syntax);

  return { colorsMap, tokenColorsMap, syntaxMap };
};

/*
 * Funcitons to build TextMate rules from ScopeMap
 * simpleTokenColorParse: creates TextMate rules with individual scopes (possibly remoedv in the future)
 * compactTokenColorParse: groups scopes with the same settings into a single TextMate rule
 */
const simpleTokenColorParse = (scopeObj: ScopeMap): TokenColorCustomization => {
  const tokenColors: TextMateRule[] = [];
  Object.entries(scopeObj).forEach(([key, settings]) => {
    if (key === "global") {
      tokenColors.push({ settings } as TextMateRule);
    } else {
      tokenColors.push({
        scope: key,
        settings,
      } as TextMateRule);
    }
  });
  return tokenColors;
};

const compactTokenColorParse = (
  scopeObj: ScopeMap
): TokenColorCustomization | null => {
  const tokenColors: TextMateRule[] = [];

  if (scopeObj.global && Object.keys(scopeObj.global).length > 0) {
    // if (scopeObj.global) {
    console.log("hola", JSON.stringify(scopeObj));
    tokenColors.push({ settings: scopeObj.global } as TextMateRule);
  }

  const groupMap = new Map<string, { scopes: string[]; settings: Settings }>();

  Object.entries(scopeObj).forEach(([key, settings]) => {
    // global case
    if (key === "global") {
      return;
    }

    // group other cases
    const keyStr = JSON.stringify(settings);
    if (groupMap.has(keyStr)) {
      groupMap.get(keyStr)!.scopes.push(key);
    } else {
      groupMap.set(keyStr, { scopes: [key], settings });
    }
  });

  // build grouped token colors
  for (const { scopes, settings } of groupMap.values()) {
    tokenColors.push({
      scope: scopes.length === 1 ? scopes[0] : scopes,
      settings,
    });
  }
  return tokenColors.length > 0 ? { textMateRules: tokenColors } : null;
};
