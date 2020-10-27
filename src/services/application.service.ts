import { Inject, Injectable, Logger } from '@nestjs/common'
import { APP_CONFIG_PROVIDER, APP_CONSUL_PROVIDER } from 'src/core/constants'
import { ConsulService } from '../modules/consul/services/consul.service'
import { ConfigService } from '../modules/config/services/config.service'
import { getIPAddress } from 'src/common'
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
            // 设置宿主地址
            config.host = getIPAddress()
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
    try {
      const root = path.join(__dirname, '..', '..', APPLICATION_DIR)
      const dirs = fs.readdirSync(root)
      return dirs.map(dir => path.join(root, dir)).filter(dir => fs.statSync(dir).isDirectory())
    } catch (err) {
      console.error('应用加载异常', err)
      return []
    }
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
