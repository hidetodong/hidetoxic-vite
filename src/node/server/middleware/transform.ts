import createDebug  from 'debug';
import { ServerContext } from './../index';
import { NextHandleFunction } from 'connect'
import { platform } from 'os';

const debug = createDebug("dev")

export async function transformRequest(url:string,serverContext:ServerContext) {
    const { pluginContainer } = serverContext
    const resolvedResult = await pluginContainer.resolveId(url)

    let transformResult;

    if(resolvedResult?.id) {
        let code = await pluginContainer.resolveId(url)

        if(typeof code === "object" && code !== null) {
            /** @ts-ignore */
            code = code.code
        }

        if(code) {
            transformResult = await pluginContainer.transform(
                /** @ts-ignore */
                code as string,
                resolvedResult?.id
            )
        }
    }

    return transformResult
}


export async function transformMiddleware(serverContext:ServerContext): NextHandleFunction {
        return async (req,res,next) => { 
            if(req.method !== "GET" || !req.url) {
                return next()
            }

            const url = req.url

            debug("transformMiddleware: %s",url)

            if(isJSRequest(url)) {
                
            }
        }
}