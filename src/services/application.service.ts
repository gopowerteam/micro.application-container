import { Inject, Injectable } from '@nestjs/common'
import { APP_CONFIG_PROVIDER, APP_CONSUL_PROVIDER } from 'src/core/constants'
import { ConsulService } from '../modules/consul/services/consul.service'
import { ConfigService } from '../modules/config/services/config.service'
import * as fs from 'fs'
import * as path from 'path'
import { resolve } from 'path'
// 插件根目录
const APPLICATION_DIR = 'public/applications'
const APPLICATION_CONFIG_PATH = 'web-config/applications'
@Injectable()
export class ApplicationService {
  constructor(
    @Inject(APP_CONFIG_PROVIDER) private configService: ConfigService,
    @Inject(APP_CONSUL_PROVIDER) private consulService: ConsulService
  ) {}

  /**
   * 应用注册
   */
  register() {
    const configs = this.getApplications()
      .filter(this.existConfig)
      .map(this.getConfig)
      .sort(this.sortConfig)
      .map(
        config =>
          new Promise((resolve, reject) => {
            this.consulService.consul.kv.set(
              `${APPLICATION_CONFIG_PATH}/${config.name}`,
              JSON.stringify(config),
              (err, result) => (err ? reject(result) : resolve(result))
            )
          })
      )
  }

  /**
   * 获取插件列表
   */
  getApplications() {
    const dirs = fs.readdirSync(path.join(__dirname, '..', '..', APPLICATION_DIR))
    return dirs.map(dir => path.join(APPLICATION_DIR, dir)).filter(dir => fs.statSync(dir).isDirectory())
  }

  /**
   * 获取配置信息
   * @param plugin 插件目录
   */
  getConfig(plugin) {
    return require(path.resolve(plugin, 'config.json'))
  }

  /**
   * 验证配置是否存在
   * @param plugin 插件目录
   */
  existConfig(plugin) {
    return fs.existsSync(path.resolve(plugin, 'config.json'))
  }

  /**
   * 排序配置
   * @param x 插件目录
   * @param y 插件目录
   */
  sortConfig(x, y) {
    return x.sort - y.sort
  }
}
// /**
//  * 生成插件列表
//  */
// export default () =>
//   getPlugins()
//     .filter(existPluginConfig)
//     .map(getPluginConfig)
//     .sort(sortPluginConfig)
// }
