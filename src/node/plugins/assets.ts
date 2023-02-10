import { ServerContext } from './../server/index';
import { Plugin } from '../plugin'
import { cleanUrl, getShortName, normalizePath, removeImportQuery } from '../utils';

export function assetsPlugin():Plugin{
    let sc:ServerContext 
    return {
        name:'h-vite:assets',
        configureServer(s){
            sc = s
        },
        async load(id){
            const cleanedId = removeImportQuery(cleanUrl(id))   
            const resolvedId = `/${getShortName(normalizePath(id),sc.root)}`

            // 先处理svg
            if(cleanedId.endsWith('.svg')) {
                return {
                    code: `export default "${resolvedId}"`
                }
            }
        }
    }
}