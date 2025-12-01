import { type Filter } from "../../../../types";
import borders from "./borders";
import solidEditor from "./solidEditor1";
import brackets from "./brackets";
import activityBar from "./activityBar";
import fileTracking from "./fileTracking";

type TemplateColor = {
  type: Exclude<Filter, "all">;
  name: string;
  properties: PropertyColor[];
  optional?: boolean;
  defaultDark: string;
  defaultLight: string;
};

type PropertyColor = {
  name: string;
  isTransparent?: boolean;
};
export type Template = {
  // index: number; // ?
  title: string;
  colors: TemplateColor[];
  alpha?: number;
};

const templateList: Template[] = [
  borders,
  solidEditor,
  brackets,
  activityBar,
  fileTracking,
];

export default templateList;
