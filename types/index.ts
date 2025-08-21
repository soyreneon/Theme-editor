export type ThemeJson = {
  name: string;
  type?: string;
  colors?: SimpleColorStructure;
  tokenColors?: TextMateRule[];
  // tokenColors?: {
  //   name?: string;
  //   scope?: string | string[];
  //   settings: {
  //     foreground?: string;
  //     background?: string;
  //     fontStyle?: string;
  //   };
  // }[];
  syntax?: SimpleColorStructure;
};
export type FullThemeJson = {
  name: string;
  type?: string;
  colors?: SimpleColorStructure;
  tokenColors?: ScopeMap;
  syntax?: SimpleColorStructure;
};

export type SimpleColorStructure = Record<string, string>;
export type ColorStructure = Record<string, string[]>;
// export type ColorUsageMap = Record<string, string[]>;
// export type SyntaxMap = Record<string, string[]>;
export type TokenColor = { scope: string[]; type: "foreground" | "background" };
export type TokenColorMap = Record<string, TokenColor & Settings>; // {"value": {scope: '', type: 'foreground'}}
export type ScopeMap = Record<
  string,
  Partial<Record<"foreground" | "background" | "fontStyle", string>>
>; // "text.html meta.embedded source.js string": {"foreground": "#96E072" }

export interface ColorMap {
  colorsMap: ColorStructure;
  tokenColorsMap: TokenColorMap;
  syntaxMap: ColorStructure;
}

// Define types for global settings
export interface GlobalCustomizations {
  colors: SimpleColorStructure;
  tokenColors: {
    textMateRules?: TextMateRule[];
    // tmp
    comments?: string;
    keywords?: string;
    strings?: string;
    numbers?: string;
    types?: string;
    functions?: string;
    variables?: string;
  };
  // tokenColors: Array<{
  //   scope: string[];
  //   settings: { foreground?: string; background?: string };
  // }>;
}

// settings.json tokenColors
export interface TokenColorCustomization {
  comments?: string;
  keywords?: string;
  strings?: string;
  numbers?: string;
  types?: string;
  functions?: string;
  variables?: string;
  textMateRules?: TextMateRule[];
  [customScope: string]: any; // allow propeties not defined as "textMateRules"
}

export type Settings = {
  foreground?: string;
  background?: string;
  fontStyle?: string;
};
export interface TextMateRule {
  name?: string;
  scope: string | string[]; // edge scenario ?
  settings: Settings;
}

type ColorInfo = {
  name: string;
  pinned: boolean;
};

export type TunerSettings = Record<string, ColorInfo>;
export type ThemeTunerSettings = Record<string, TunerSettings>;
