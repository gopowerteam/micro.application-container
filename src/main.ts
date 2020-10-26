import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { APP_CONFIG_PROVIDER } from './core/constants'
import { Application } from './core/application'
// https支持
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function bootstrap() {
  const app = await NestFactory.create(AppModule).then(Application.initialize)
  // 获取配置服务
  const config = app.get(APP_CONFIG_PROVIDER)
  // 获取监听端口
  const port = config.get('service.port')
  // 建立服务监听
  await app.listen(port)
}

bootstrap()
