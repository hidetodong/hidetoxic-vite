import { NextHandleFunction } from 'connect';
import { pathExists, readFile } from 'fs-extra';
import path from 'path';
import { ServerContext } from '../index';

export function indexHtmlMiddleware(serverContext:ServerContext): NextHandleFunction {
    return async (req,res,next) => {
        if(req.url === "/") {
            const { root } = serverContext
            const indexHtmlPath = path.join(root,"index.html")
            if(await pathExists(indexHtmlPath)){
                const rawHtml = await readFile(indexHtmlPath,"utf8")
                let html = rawHtml

                for(const plugin of serverContext.plugins) {
                    if(plugin.transformIndexHtml) {
                        html = await plugin.transformIndexHtml(html)
                    }
                }

                res.statusCode = 200
                res.setHeader("Content-Type","text/html")
                return res.end(html)
            }
        }

        return next()
    }
}