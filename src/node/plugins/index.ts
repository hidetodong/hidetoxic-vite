import { Plugin } from "../plugin";
import { assetsPlugin } from "./assets";
import { clientInjectPlugin } from "./clientInject";
import { cssPlugin } from "./css";
import { esbuildTransformPlugin } from "./esbuild";
import { importAnalysisPlugin } from "./importAnalysis";
import { resolvePlugin } from "./resolve";

export function resolvePlugins(): Plugin[] {
  return [
    clientInjectPlugin(),
    resolvePlugin(), 
    esbuildTransformPlugin(), 
    importAnalysisPlugin(),
    cssPlugin(),
    assetsPlugin(),
  ];
}
