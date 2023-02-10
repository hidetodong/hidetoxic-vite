import { NextHandleFunction } from "connect";
import { isJSRequest, cleanUrl, isCSSRequest, isImportRequest } from "../../utils";
import { ServerContext } from "../index";
import createDebug from "debug";

const debug = createDebug("dev");

export async function transformRequest(
  url: string,
  serverContext: ServerContext
) {
  const { pluginContainer,moduleGraph } = serverContext;
  
  url = cleanUrl(url);
  let mod = await moduleGraph.getModuleByUrl(url);

    // 如果有缓存了 就不用转换 直接返回缓存的结果
  if(mod && mod.transformResult) {
    return mod.transformResult
  }
  
  // 简单来说，就是依次调用插件容器的 resolveId、load、transform 方法
  const resolvedResult = await pluginContainer.resolveId(url);
  let transformResult;
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id);
    if (typeof code === "object" && code !== null) {
      code = code.code;
    }
    mod = await moduleGraph.ensureEntryFromUrl(url)


    if (code) {
      transformResult = await pluginContainer.transform(
        code as string,
        resolvedResult?.id
      );
    }

    // 缓存转换结果
    if(mod) {
        mod.transformResult = transformResult
    }
  }
  return transformResult;
}

export function transformMiddleware(
  serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== "GET" || !req.url) {
      return next();
    }
    const url = req.url;
    debug("transformMiddleware: %s", url);
    // transform JS request
    if (isJSRequest(url) || isCSSRequest(url) || isImportRequest(url)) {
      // 核心编译函数
      let result = await transformRequest(url, serverContext);
      let final;
      if (!result) {
        return next();
      }
      if (result && typeof result !== "string") {
        final = result.code;
      }
      // 编译完成，返回响应给浏览器
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/javascript");
      return res.end(final);
    }

    next();
  };
}
