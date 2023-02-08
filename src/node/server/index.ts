

import connect from 'connect'

import { blue,green } from 'picocolors'
import { optimize } from '../optimizer'

export interface ServerContext {}

export async function startDevServer(){
    const app = connect()

    const root = process.cwd()
    const startTime = Date.now()
    app.listen(3000,async ()=>{

        await optimize(root)

        console.log(
            green("🚀HIDETOXIC-VITE 已启动"),
            `总时间${Date.now() - startTime}ms`
        )

        console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`)
    })
}