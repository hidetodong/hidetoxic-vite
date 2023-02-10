import { ModuleGraph } from './../ModuleGraph';
import { PluginContainer, createPluginContainer } from "./../pluginContainer";
import connect from "connect";
import chokidar,{ FSWatcher } from 'chokidar'

import { blue, green } from "picocolors";
import { optimize } from "../optimizer";
import { resolvePlugins } from "../plugins";
import { Plugin } from "../plugin";
import { indexHtmlMiddleware } from "./middleware/indexHtml";
import { transformMiddleware } from "./middleware/transform";
import { staticMiddleware } from './middleware/static'
import { createWebSocketServer } from '../ws';
import { bindingHMREvents } from '../hmr';

export interface ServerContext {
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
  moduleGraph: ModuleGraph,
  ws: { send: (data: any) => void; close: () => void },
  watcher: FSWatcher;
}

export async function startDevServer() {
  const app = connect();
  const ws = createWebSocketServer(app)
  // 获取执行路径
  const root = process.cwd();
  // 初始化监听器
  const watcher = chokidar.watch(root, {
    ignored: ["**/node_modules/**", "**/.git/**"],
    ignoreInitial: true,
  });

  // 获取服务器内置插件
  const plugins = resolvePlugins();
  // 初始化模块依赖图
  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url));
  // 创建插件容器
  const pluginContainer = createPluginContainer(plugins);
  // 获取启动时间
  const startTime = Date.now();


  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher
  };

  bindingHMREvents(serverContext)

  // 执行所有插件内设置服务器的钩子
  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext);
    }
  }

  // html注入插件
  app.use(indexHtmlMiddleware(serverContext));
  // 转译插件
  app.use(transformMiddleware(serverContext));
  // 静态资源插件
  app.use(staticMiddleware(serverContext.root))

  app.listen(3000, async () => {
    await optimize(root);

    console.log(
      green("🚀Server 已启动"),
      `总时间${Date.now() - startTime}ms`
    );

    console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
  });
}
