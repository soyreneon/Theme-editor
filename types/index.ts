export type ThemeJson = {
  name: string;
  type?: string;
  semanticHighlighting?: boolean | "configuredByTheme";
  semanticTokenColors?: SemanticTokenColors;
  colors?: SimpleColorStructure;
  tokenColors?: TextMateRule[];
  syntax?: SimpleColorStructure;
};
export type FullThemeJson = {
  name: string;
  type?: string;
  colors?: SimpleColorStructure;
  tokenColors?: ScopeMap;
  syntax?: SimpleColorStructure;
  semanticHighlighting?: boolean | "configuredByTheme";
  semanticTokenColors?: SemanticTokenColors;
};

export type SimpleColorStructure = Record<string, string>;
export type ColorStructure = Record<string, string[]>;

export type CustomSemanticTokenColors = Record<
  string,
  CustomSemanticTokenObject
>;
type CustomSemanticTokenObject = {
  enabled?: boolean | "configuredByTheme";
  rules?: SemanticTokenColors;
};

type SemanticTokenStyle =
  | string
  | {
      foreground?: string;
      [key: string]: unknown;
    };

export type SemanticTokenColors = {
  [token: string]: SemanticTokenStyle;
};

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
  semanticTokenColorsMap: ColorStructure;
}

// Define types for global settings
export interface GlobalCustomizations {
  colors: SimpleColorStructure;
  tokenColors: {
    textMateRules?: TextMateRule[];
    comments?: string;
    keywords?: string;
    strings?: string;
    numbers?: string;
    types?: string;
    functions?: string;
    variables?: string;
  };
  semanticHighlighting?: boolean | "configuredByTheme";
  semanticTokenColors?: SemanticTokenColors;
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

export type Group = {
  colors: boolean;
  tokenColors: boolean;
  syntax: boolean;
  semanticTokenColors: boolean;
};

export type Filter =
  | "colors"
  | "tokenColors"
  | "syntax"
  | "semanticTokenColors"
  | "all";

export type ColorOrders = Record<Filter, string[]>;

export type PropertyColor = { property: string; color: string };
