import { PluginContainer, createPluginContainer } from "./../pluginContainer";
import connect from "connect";

import { blue, green } from "picocolors";
import { optimize } from "../optimizer";
import { resolvePlugins } from "../plugins";
import { Plugin } from "../plugin";
import { indexHtmlMiddleware } from "./middleware/indexHtml";
import { transformMiddleware } from "./middleware/transform";

export interface ServerContext {
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
}

export async function startDevServer() {
  const app = connect();

  const root = process.cwd();
  const startTime = Date.now();

  const plugins = resolvePlugins();
  const pluginContainer = createPluginContainer(plugins);

  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
  };

  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext);
    }
  }

  //  处理 html文件
  app.use(indexHtmlMiddleware(serverContext));

  app.use(transformMiddleware(serverContext));

  app.listen(3000, async () => {
    await optimize(root);

    console.log(
      green("🚀HIDETOXIC-VITE 已启动"),
      `总时间${Date.now() - startTime}ms`
    );

    console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
  });
}
