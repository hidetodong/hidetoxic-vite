var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});

// src/node/cli.ts
import cac from "cac";

// src/node/pluginContainer.ts
var createPluginContainer = (plugins) => {
  class Context {
    async resolve(id, importer) {
      let out = await pluginContainer.resolveId(id, importer);
      if (typeof out === "string")
        out = { id: out };
      return out;
    }
  }
  const pluginContainer = {
    async resolveId(id, importer) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const newId = await plugin.resolveId.call(ctx, id, importer);
          if (newId) {
            id = typeof newId === "string" ? newId : newId.id;
            return { id };
          }
        }
      }
      return null;
    },
    async load(id) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.load) {
          const result = await plugin.load.call(ctx, id);
          if (result) {
            return result;
          }
        }
      }
      return null;
    },
    async transform(code, id) {
      const ctx = new Context();
      for (const plugin of plugins) {
        if (plugin.transform) {
          const result = await plugin.transform.call(ctx, code, id);
          if (!result)
            continue;
          if (typeof result === "string") {
            code = result;
          } else if (result.code) {
            code = result.code;
          }
        }
      }
      return { code };
    }
  };
  return pluginContainer;
};

// src/node/server/index.ts
import connect from "connect";
import { blue, green as green2 } from "picocolors";

// src/node/optimizer/index.ts
import path4 from "path";
import { build } from "esbuild";
import { green } from "picocolors";

// src/node/constants.ts
import path from "path";
var EXTERNAL_TYPES = [
  "css",
  "less",
  "sass",
  "scss",
  "styl",
  "stylus",
  "pcss",
  "postcss",
  "vue",
  "svelte",
  "marko",
  "astro",
  "png",
  "jpe?g",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif"
];
var BARE_IMPORT_RE = /^[\w@][^:]/;
var PRE_BUNDLE_DIR = path.join("node_modules", ".h-vite");
var JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/;
var QUERY_RE = /\?.*$/s;
var HASH_RE = /#.*$/s;
var DEFAULT_EXTENSIONS = [".tsx", ".ts", ".jsx", "js"];

// src/node/optimizer/scanPlugin.ts
function scanPlugin(deps) {
  return {
    name: "esbuild:scan-deps",
    setup(build2) {
      build2.onResolve(
        { filter: new RegExp(`\\.(${EXTERNAL_TYPES.join("|")})$`) },
        (resolveInfo) => {
          return {
            path: resolveInfo.path,
            external: true
          };
        }
      );
      build2.onResolve(
        {
          filter: BARE_IMPORT_RE
        },
        (resolveInfo) => {
          const { path: id } = resolveInfo;
          deps.add(id);
          return {
            path: id,
            external: true
          };
        }
      );
    }
  };
}

// src/node/optimizer/preBundlePlugin.ts
import { init, parse } from "es-module-lexer";
import path3 from "path";
import resolve from "resolve";
import fs from "fs-extra";
import createDebug from "debug";

// src/node/utils.ts
import os from "os";
import path2 from "path";
function slash(p) {
  return p.replace(/\\/g, "/");
}
var isWindows = os.platform() === "win32";
function normalizePath(id) {
  return path2.posix.normalize(isWindows ? slash(id) : id);
}
var isJSRequest = (id) => {
  id = cleanUrl(id);
  if (JS_TYPES_RE.test(id)) {
    return true;
  }
  if (!path2.extname(id) && !id.endsWith("/")) {
    return true;
  }
  return false;
};
var cleanUrl = (url) => url.replace(HASH_RE, "").replace(QUERY_RE, "");

// src/node/optimizer/preBundlePlugin.ts
var debug = createDebug("dev");
function preBundlePlugin(deps) {
  return {
    name: "esbuild:pre-bundle",
    setup(build2) {
      build2.onResolve(
        {
          filter: BARE_IMPORT_RE
        },
        (resolveInfo) => {
          const { path: id, importer } = resolveInfo;
          const isEntry = !importer;
          if (deps.has(id)) {
            return isEntry ? {
              path: id,
              namespace: "dep"
            } : {
              path: resolve.sync(id, { basedir: process.cwd() })
            };
          }
        }
      );
      build2.onLoad(
        {
          filter: /.*/,
          namespace: "dep"
        },
        async (loadInfo) => {
          await init;
          const id = loadInfo.path;
          const root = process.cwd();
          const entryPath = normalizePath(resolve.sync(id, { basedir: root }));
          const code = await fs.readFile(entryPath, "utf-8");
          const [imports, exports] = await parse(code);
          let proxyModule = [];
          if (!imports.length && !exports.length) {
            const res = __require(entryPath);
            const specifiers = Object.keys(res);
            proxyModule.push(
              `export { ${specifiers.join(",")} } from "${entryPath}"`,
              `export default require("${entryPath}")`
            );
          } else {
            if (exports.includes("default")) {
              proxyModule.push(`import d from "${entryPath}";export default d`);
            }
            proxyModule.push(`export * from "${entryPath}"`);
          }
          debug("\u4EE3\u7406\u6A21\u5757\u5185\u5BB9: %o", proxyModule.join("\n"));
          const loader = path3.extname(entryPath).slice(1);
          return {
            loader,
            contents: proxyModule.join("\n"),
            resolveDir: root
          };
        }
      );
    }
  };
}

// src/node/optimizer/index.ts
async function optimize(root) {
  const entry = path4.resolve(root, "src/main.tsx");
  const deps = /* @__PURE__ */ new Set();
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)]
  });
  console.log(`${green("\u9700\u8981\u9884\u6784\u5EFA\u7684\u4F9D\u8D56\uFF1A")}
${[...deps].map(green).map((item) => ` ${item}`).join("\n")}`);
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: "esm",
    splitting: true,
    outdir: path4.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)]
  });
}

// src/node/plugins/esbuild.ts
import { readFile } from "fs-extra";
import path5 from "path";
import esbuild from "esbuild";
function esbuildTransformPlugin() {
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
        const extname = path5.extname(id).slice(1);
        const { code: tranformedCode, map } = await esbuild.transform(code, {
          target: "esnext",
          format: "esm",
          sourcemap: true,
          loader: extname
        });
        return {
          code: tranformedCode,
          map
        };
      }
      return null;
    }
  };
}

// src/node/plugins/importAnalysis.ts
import { init as init2, parse as parse2 } from "es-module-lexer";
import MagicString from "magic-string";
import path6 from "path";
function importAnalysisPlugin() {
  let serverContext;
  return {
    name: "m-vite:import-analysis",
    configureServer(s) {
      serverContext = s;
    },
    async transform(code, id) {
      if (!isJSRequest(id)) {
        return null;
      }
      await init2;
      const [imports] = parse2(code);
      const ms = new MagicString(code);
      for (const importInfo of imports) {
        const { s: modStart, e: modEnd, n: modSource } = importInfo;
        if (!modSource)
          continue;
        if (BARE_IMPORT_RE.test(modSource)) {
          const bundlePath = normalizePath(
            path6.join("/", PRE_BUNDLE_DIR, `${modSource}.js`)
          );
          ms.overwrite(modStart, modEnd, bundlePath);
        } else if (modSource.startsWith(".") || modSource.startsWith("/")) {
          const resolved = await this.resolve(modSource, id);
          if (resolved) {
            ms.overwrite(modStart, modEnd, resolved.id);
          }
        }
      }
      return {
        code: ms.toString(),
        map: ms.generateMap()
      };
    }
  };
}

// src/node/plugins/resolve.ts
import path7 from "path";
import { pathExists } from "fs-extra";
import resolve2 from "resolve";
function resolvePlugin() {
  let serverContext;
  return {
    name: "h-vite:resolve",
    configureServer(s) {
      serverContext = s;
    },
    async resolveId(id, importer) {
      if (path7.isAbsolute(id)) {
        if (await pathExists(id)) {
          return { id };
        }
        id = path7.join(serverContext.root, id);
        if (await pathExists(id)) {
          return { id };
        }
      } else if (id.startsWith(".")) {
        if (!importer) {
          throw new Error("fuck");
        }
        const hasExtension = path7.extname(id).length > 1;
        let resolvedId;
        if (hasExtension) {
          resolvedId = normalizePath(
            resolve2.sync(id, { basedir: path7.dirname(importer) })
          );
          if (await pathExists(resolvedId)) {
            return { id: resolvedId };
          }
        } else {
          for (const extname of DEFAULT_EXTENSIONS) {
            try {
              const withExtension = `${id}${extname}`;
              resolvedId = normalizePath(
                resolve2.sync(withExtension, { basedir: path7.dirname(importer) })
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
    }
  };
}

// src/node/plugins/index.ts
function resolvePlugins() {
  return [resolvePlugin(), esbuildTransformPlugin(), importAnalysisPlugin()];
}

// src/node/server/middleware/indexHtml.ts
import { pathExists as pathExists2, readFile as readFile2 } from "fs-extra";
import path8 from "path";
function indexHtmlMiddleware(serverContext) {
  return async (req, res, next) => {
    if (req.url === "/") {
      const { root } = serverContext;
      const indexHtmlPath = path8.join(root, "index.html");
      if (await pathExists2(indexHtmlPath)) {
        const rawHtml = await readFile2(indexHtmlPath, "utf8");
        let html = rawHtml;
        for (const plugin of serverContext.plugins) {
          if (plugin.transformIndexHtml) {
            html = await plugin.transformIndexHtml(html);
          }
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        return res.end(html);
      }
    }
    return next();
  };
}

// src/node/server/middleware/transform.ts
import createDebug2 from "debug";
var debug2 = createDebug2("dev");
async function transformRequest(url, serverContext) {
  const { pluginContainer } = serverContext;
  url = cleanUrl(url);
  const resolvedResult = await pluginContainer.resolveId(url);
  let transformResult;
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id);
    if (typeof code === "object" && code !== null) {
      code = code.code;
    }
    if (code) {
      transformResult = await pluginContainer.transform(
        code,
        resolvedResult?.id
      );
    }
  }
  return transformResult;
}
function transformMiddleware(serverContext) {
  return async (req, res, next) => {
    if (req.method !== "GET" || !req.url) {
      return next();
    }
    const url = req.url;
    debug2("transformMiddleware: %s", url);
    if (isJSRequest(url)) {
      let result = await transformRequest(url, serverContext);
      let final;
      if (!result) {
        return next();
      }
      if (result && typeof result !== "string") {
        final = result.code;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/javascript");
      return res.end(final);
    }
    next();
  };
}

// src/node/server/index.ts
async function startDevServer() {
  const app = connect();
  const root = process.cwd();
  const startTime = Date.now();
  const plugins = resolvePlugins();
  const pluginContainer = createPluginContainer(plugins);
  const serverContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins
  };
  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext);
    }
  }
  app.use(indexHtmlMiddleware(serverContext));
  app.use(transformMiddleware(serverContext));
  app.listen(3e3, async () => {
    await optimize(root);
    console.log(
      green2("\u{1F680}HIDETOXIC-VITE \u5DF2\u542F\u52A8"),
      `\u603B\u65F6\u95F4${Date.now() - startTime}ms`
    );
    console.log(`> \u672C\u5730\u8BBF\u95EE\u8DEF\u5F84: ${blue("http://localhost:3000")}`);
  });
}

// src/node/cli.ts
var cli = cac();
cli.command("[root]", "Run dev server").alias("serve").alias("dev").action(async () => {
  await startDevServer();
});
cli.help();
cli.parse();
//# sourceMappingURL=index.mjs.map