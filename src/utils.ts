import {
  type TokenColorMap,
  type ColorStructure,
  type FullThemeJson,
  type GlobalCustomizations,
  type TokenColorCustomization,
  type TextMateRule,
  type TokenColor,
  type SemanticTokenColors,
  type Settings,
  type SimpleColorStructure,
  type ScopeMap,
  type ColorMap,
  type ColorOrders,
  type PropertyColor,
} from "../types/";

// Helper function to normalize color to 6-digit hex without alpha and lowercase
export const normalizeColor = (color: string): string => {
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
  } else if (color.length === 5) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toLowerCase();
  } else if (color.length === 9) {
    return color.substring(0, 7).toLowerCase();
  }
  return color.toLowerCase();
};

// get alpha chanel in color code
export const getAlpha = (color: string): string => {
  if (color.length === 5) {
    return `${color[4]}${color[4]}`.toLowerCase();
  } else if (color.length === 9) {
    return color.substring(7, 9).toLowerCase();
  }
  return "";
};

// check if an object is empty
export const isEmpty = (obj: {}) => {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }
  return true;
};

/*
 * Get props with alpha chanel
 */
export const getAlphaProps = (
  colorKeys: SimpleColorStructure = {}
  // color: string
): SimpleColorStructure[] => {
  if (isEmpty(colorKeys)) {
    return [];
  }

  const newColorKeys: SimpleColorStructure[] = [];
  for (const [key, value] of Object.entries(colorKeys)) {
    const alpha = getAlpha(value);
    if (alpha) {
      newColorKeys.push({ [key]: alpha });
    }
  }

  return newColorKeys;
};

/*
 * Array colors to properties
 */
export const buildPropertyColorCustomizations = (
  colorKeys: PropertyColor[],
  themeColorCustomizations: Record<string, any>
): SimpleColorStructure => {
  // generate new colors
  colorKeys.forEach((setting) => {
    let newAlpha = getAlpha(setting.color);
    if (newAlpha === "ff") {
      newAlpha = "";
    }

    themeColorCustomizations[setting.property] = `${normalizeColor(
      setting.color
    )}${newAlpha}`;
  });
  return themeColorCustomizations;
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
  // generate new colors
  colorKeys.forEach((setting) => {
    const currentColor =
      themeColorCustomizations[setting] ?? themeObjColors?.[setting];
    const alpha = getAlpha(currentColor);

    themeColorCustomizations[setting] = `${normalizeColor(color)}${alpha}`;
  });
  return themeColorCustomizations;
};

export const buildPropertyTokenColorCustomizations = (
  propertyColors: PropertyColor[], // new keys to add on settings.json
  themeTokenColorCustomizations: TokenColorCustomization // settingsTokenKeys from settings.json
): TokenColorCustomization | null => {
  const tokeyKeys: TextMateRule[] = propertyColors.map(
    (propColor) =>
      ({
        scope: [propColor.property],
        settings: { foreground: propColor.color },
      } as TextMateRule)
  );

  const { scopeMap } = mapTextMateRules(
    themeTokenColorCustomizations.textMateRules as TextMateRule[],
    tokeyKeys,
    true
  );

  return compactTokenColorParse(scopeMap);
};

export const buildTokenColorCustomizations = (
  tokenKeys: TokenColor, // new keys to add on settings.json
  themeTokenColorCustomizations: TokenColorCustomization, // settingsTokenKeys from settings.json
  color: string // new color
  // themeObjTokenColors?: TextMateRule[] // from theme.json (to remove redundant colors)
): TokenColorCustomization | null => {
  const { scopeMap } = mapTextMateRules(
    themeTokenColorCustomizations.textMateRules as TextMateRule[],
    [{ scope: tokenKeys.scope, settings: { [tokenKeys.type]: color } }],
    true
  );

  return compactTokenColorParse(scopeMap);
};

const getCleanSyntax = (
  newSyntax: SimpleColorStructure,
  customSyntax: TokenColorCustomization
): SimpleColorStructure => {
  const result: SimpleColorStructure = {};

  // divide keys if they are compounded
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

  return result;
};

export const buildPropertySyntaxColorCustomizations = (
  themeTokenColorCustomizations: TokenColorCustomization, // settingsTokenKeys from settings.json
  colors: PropertyColor[] // new color
): SimpleColorStructure | null => {
  const { textMateRules, ...customSyntax } = themeTokenColorCustomizations;
  const newSyntax: SimpleColorStructure = Object.fromEntries(
    colors.map((x) => [x.property, x.color])
  );
  return getCleanSyntax(newSyntax, customSyntax);
};

export const buildSyntaxColorCustomizations = (
  syntaxKeys: string[], // new keys to add on settings.json
  themeTokenColorCustomizations: TokenColorCustomization, // settingsTokenKeys from settings.json
  color: string // new color
): SimpleColorStructure | null => {
  const { textMateRules, ...customSyntax } = themeTokenColorCustomizations;

  // separate entries if they re compound, e.g.:  ["variables, properties"]
  syntaxKeys = syntaxKeys.reduce(
    (acc: string[], current) =>
      (acc = [...acc, ...current.split(",").map((x) => x.trim())]),
    []
  );

  // create pair colors obj:  {"variables":"#c54e64","properties":"#c54e64","numbers":"#c54e64"}
  const newSyntax: SimpleColorStructure = Object.fromEntries(
    syntaxKeys.map((x) => [x, color])
  );

  return getCleanSyntax(newSyntax, customSyntax);
};

export const buildPropertySemanticTokenColorCustomizations = (
  propertyColors: PropertyColor[],
  themeTokenColorCustomizations: SemanticTokenColors
): SemanticTokenColors => {
  const result: SemanticTokenColors = {
    ...JSON.parse(JSON.stringify(themeTokenColorCustomizations)),
  };

  propertyColors.forEach((key) => {
    if (result[key.property]) {
      if (
        typeof result[key.property] === "object" &&
        result[key.property] !== null
      ) {
        result[key.property] = {
          ...(result[key.property] as Object),
          foreground: key.color,
        };
      } else {
        result[key.property] = { foreground: key.color };
      }
    } else {
      result[key.property] = { foreground: key.color };
    }
  });

  return result;
};

export const buildSemanticTokenColorCustomizations = (
  semanticKeys: string[],
  themeTokenColorCustomizations: SemanticTokenColors,
  color: string
): SemanticTokenColors => {
  const result: SemanticTokenColors = {
    ...JSON.parse(JSON.stringify(themeTokenColorCustomizations)),
  };

  semanticKeys.forEach((key) => {
    if (result[key]) {
      if (typeof result[key] === "object" && result[key] !== null) {
        result[key] = { ...result[key], foreground: color };
      } else {
        result[key] = { foreground: color };
      }
    } else {
      result[key] = { foreground: color };
    }
  });

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
  const { scopeMap } = mapTextMateRules(
    tokenKeys.textMateRules as TextMateRule[],
    // themeObjTokenColors as TextMateRule[]
    [],
    true
  );

  const result: ScopeMap = {};
  for (const [key, settings] of Object.entries(scopeMap)) {
    // Copy only when it doesn't match with `val`
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

  return compactTokenColorParse(result);
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

export const removeSemanticTokenColorCustomizations = (
  tokenKeys: SemanticTokenColors,
  color: string
): SemanticTokenColors | null => {
  console.log(tokenKeys, color);
  const result: SemanticTokenColors = {};

  for (const [key, value] of Object.entries(tokenKeys)) {
    if (
      typeof value === "string" &&
      normalizeColor(value) !== normalizeColor(color)
    ) {
      result[key] = { foreground: value };
    } else if (typeof value === "object" && value?.foreground) {
      if (normalizeColor(value?.foreground || "") !== normalizeColor(color)) {
        result[key] = value as any;
      } else {
        const { foreground, ...rest } = value;
        if (!isEmpty(rest)) {
          result[key] = rest;
        }
      }
    }
  }
  return result;
};

/*
 * Merge colors
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
  expandAndAssign(syntax2); // overwrite if exists

  return result;
};

export const mergeSemanticTokens = (
  stokens1: SemanticTokenColors,
  stokens2: SemanticTokenColors
) => {
  const result: SemanticTokenColors = {};

  const expandAndAssign = (source: SemanticTokenColors) => {
    // ? normalize color??
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "string") {
        result[key] = { foreground: value };
      } else {
        result[key] = value as any;
      }
    }
  };

  expandAndAssign(stokens1);
  expandAndAssign(stokens2); // overwrite if exists
  return result;
};

export const mapTextMateRules = (
  mateRules1: TextMateRule[],
  mateRules2: TextMateRule[],
  addExtraSettings?: boolean
): {
  scopeMap: ScopeMap;
  // nameColorMap: SimpleColorStructure;
} => {
  const scopeMap: ScopeMap = {};
  // const nameColorMap: SimpleColorStructure = {};

  const processRules = (rules: TextMateRule[]) => {
    for (const rule of rules) {
      // const { scope, settings, name } = rule;
      const { scope, settings } = rule;

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
      // if (name && settings.foreground) {
      //   nameColorMap[name] = settings.foreground;
      // } else if (settings.foreground) {
      //   nameColorMap[settings.foreground] = settings.foreground;
      // }
    }
  };

  mateRules1 && processRules(mateRules1);
  mateRules2 && processRules(mateRules2);
  // return { scopeMap, nameColorMap };
  return { scopeMap };
};

/*
 * getColorUsage()
 * Extract theme into a more readable and processable object
 * getColorUsage is the main function
 */
const getColorsMap = (themeColors?: SimpleColorStructure): ColorStructure => {
  const colorsMap: ColorStructure = {};
  for (const [property, value] of Object.entries(themeColors ?? {})) {
    // if (!Array.isArray(value)) {
    if (typeof value === "string") {
      const normalizedColor = normalizeColor(value);
      if (!colorsMap[normalizedColor]) {
        colorsMap[normalizedColor] = [];
      }
      colorsMap[normalizedColor].push(property);
    }
  }
  return colorsMap;
};

const getTokenColorsMap = (
  themeTokenColors?: ScopeMap,
  addExtraSettings?: boolean
): TokenColorMap => {
  const tokenColorsMap: TokenColorMap = {};

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

const getSemanticMap = (themeSemantic: SemanticTokenColors): ColorStructure => {
  const semanticMap: ColorStructure = {};

  for (const [name, obj] of Object.entries(
    themeSemantic as SemanticTokenColors
  )) {
    if (typeof obj === "object" && obj !== null && obj?.foreground) {
      const normalizedColor = normalizeColor(obj?.foreground as string);
      if (!semanticMap[normalizedColor]) {
        semanticMap[normalizedColor] = [];
      }
      semanticMap[normalizedColor].push(name);
    }
  }

  return semanticMap;
};

export const getColorUsage = (
  theme: FullThemeJson
): {
  colorsMap: ColorStructure;
  tokenColorsMap: TokenColorMap;
  syntaxMap: ColorStructure;
  semanticTokenColorsMap: ColorStructure;
} => {
  const colorsMap = getColorsMap(theme.colors);
  const tokenColorsMap = getTokenColorsMap(theme.tokenColors);
  const syntaxMap = getSyntaxMap(theme.syntax);
  const semanticTokenColorsMap = getSemanticMap(
    theme.semanticTokenColors as SemanticTokenColors
  );

  return { colorsMap, tokenColorsMap, syntaxMap, semanticTokenColorsMap };
};

/*
 * Functions to build TextMate rules from ScopeMap
 * simpleTokenColorParse: creates TextMate rules with individual scopes (possibly removed in the future)
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

/*
 * Get custom colors on settings.json to show on frontend
 */
export const getCustomColors = (global: GlobalCustomizations): string[] => {
  const colorList = new Set<string>();
  // colors
  for (const [_, value] of Object.entries(global.colors)) {
    if (typeof value === "string") {
      // if (!Array.isArray(value)) {
      colorList.add(normalizeColor(value));
    }
  }

  const { textMateRules, ...rest } = global.tokenColors;
  // tokens
  textMateRules?.map((rule) => {
    if (rule.settings.background) {
      colorList.add(normalizeColor(rule.settings.background));
    }
    if (rule.settings.foreground) {
      colorList.add(normalizeColor(rule.settings.foreground));
    }
  });

  // syntax
  for (const [_, value] of Object.entries(rest)) {
    colorList.add(normalizeColor(value));
  }

  // semantic tokens
  for (const [_, value] of Object.entries(global.semanticTokenColors || {})) {
    if (typeof value === "string") {
      colorList.add(normalizeColor(value));
    } else if (value?.foreground) {
      colorList.add(normalizeColor(value?.foreground as string));
    }
  }

  return Array.from(colorList.values());
};

/*
 * Functions to build TextMate rules from ScopeMap
 * simpleTokenColorParse: creates TextMate rules with individual scopes (possibly removed in the future)
 * compactTokenColorParse: groups scopes with the same settings into a single TextMate rule
 */
export const sortColorsByAppereances = (colormaps: ColorMap): ColorOrders => {
  // Create a unified colorCounts object
  const maps = ["colors", "tokenColors", "syntax", "semanticTokenColors"];
  type Counts = Record<string, { count: number }>;
  const colorCounts: Counts = {};
  const colorGroupCounts: Record<(typeof maps)[number], Counts> = {
    colors: {},
    tokenColors: {},
    syntax: {},
    semanticTokenColors: {},
  };

  // Count elements in colorsMap
  maps.forEach((mapGroup) => {
    for (const [color, properties] of Object.entries(
      colormaps[`${mapGroup}Map` as keyof ColorMap]
    )) {
      if (!colorCounts[color]) {
        colorCounts[color] = { count: 0 };
      }
      if (!colorGroupCounts[mapGroup][color]) {
        colorGroupCounts[mapGroup][color] = { count: 0 };
      }

      if (mapGroup === "tokenColors") {
        colorGroupCounts[mapGroup][color].count += properties.scope.length;
        colorCounts[color].count += properties.scope.length;
      } else {
        colorGroupCounts[mapGroup][color].count += properties.length;
        colorCounts[color].count += properties.length;
      }
    }
  });

  const sortByNumber = (counts: Counts): string[] =>
    Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count) // More elements first
      .map(([color]) => color);
  // Sort colors by count in descending order and return as an array of color keys
  return {
    ...maps.reduce(
      (acc, current) => ({
        ...acc,
        [current]: sortByNumber(colorGroupCounts[current]),
      }),
      {} as ColorOrders
    ),
    all: sortByNumber(colorCounts),
  };
};
