/*
 * @Author: hidetodong
 * @Date: 2023-02-09 21:51:19
 * @LastEditTime: 2023-02-09 22:31:09
 * @LastEditors: hidetodong
 * @Description:
 * @FilePath: /hidetoxic-vite/src/node/plugins/resolve.ts
 * HIDETOXIC - 版权所有
 */
import path from "path";
import { ServerContext } from "../server";
import { Plugin } from "../plugin";
import { pathExists } from "fs-extra";
import resolve from "resolve";
import { DEFAULT_EXTENSIONS } from "../constants";
import { normalizePath } from "../utils";

/** 路径解析插件 */
export function resolvePlugin(): Plugin {
  let serverContext: ServerContext;

  return {
    name: "h-vite:resolve",
    configureServer(s) {
      // 先保存服务端上下文
      serverContext = s;
    },
    async resolveId(id: string, importer?: string) {
      // 1.处理绝对路径
      if (path.isAbsolute(id)) {
        if (await pathExists(id)) {
          // 返回的id就是实际文件的路径
          return { id };
        }
        // 加上 root 路径前缀，处理/src/main.tsx的情况
        id = path.join(serverContext.root, id);
        if (await pathExists(id)) {
          return { id };
        }
      }

      // 2.相对路径
      else if (id.startsWith(".")) {
        if (!importer) {
          throw new Error("fuck");
        }
        // 判断是否有后缀名
        const hasExtension = path.extname(id).length > 1;
        let resolvedId: string;
        // 2.1 包含后缀 ./App.tsx
        if (hasExtension) {
          resolvedId = normalizePath(
            resolve.sync(id, { basedir: path.dirname(importer) })
          );
          if (await pathExists(resolvedId)) {
            return { id: resolvedId };
          }
        }
        // 2.2 不包含后缀 ./App
        else {
          // ./App -> ./App.tsx
          for (const extname of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${extname}`;
              resolvedId = normalizePath(
                resolve.sync(withExtension, { basedir: path.dirname(importer) })
              );
              if (await pathExists(resolvedId)) {
                return { id: resolvedId };
              }
            } catch (error) {
              continue;
            }
          }
        }
      }
      return null;
    },
  };
}
