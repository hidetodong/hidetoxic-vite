/*
 * @Author: hidetodong
 * @Date: 2023-02-09 22:10:55
 * @LastEditTime: 2023-02-09 22:16:43
 * @LastEditors: hidetodong
 * @Description:
 * @FilePath: /hidetoxic-vite/src/node/plugins/esbuild.ts
 * HIDETOXIC - 版权所有
 */

import { readFile } from "fs-extra";
import path from "path";
import { Plugin } from "../plugin";
import { isJSRequest } from "../utils";
import esbuild from "esbuild";

/** esbuild转译插件 */
export function esbuildTransformPlugin(): Plugin {
  return {
    name: "h-vite:esbuild-transform",
    async load(id) {
      if (isJSRequest(id)) {
        try {
          const code = await readFile(id, "utf-8");
          return code;
        } catch (error) {
          return null;
        }
      }
    },
    async transform(code, id) {
      if (isJSRequest(id)) {
        const extname = path.extname(id).slice(1);
        const { code: tranformedCode, map } = await esbuild.transform(code, {
          target: "esnext",
          format: "esm",
          sourcemap: true,
          loader: extname as "js" | "ts" | "jsx" | "tsx",
        });
        return {
          code: tranformedCode,
          map,
        };
      }
      return null;
    },
  };
}
