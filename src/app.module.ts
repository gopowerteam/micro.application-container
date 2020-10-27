import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module'
import { join } from 'path'
import { AppController } from './app.controller'
import { AppService } from './services/app.service'
import { ConfigModule } from './modules/config/config.module'
import { ConsulModule } from './modules/consul/consul.module'
import { ApplicationService } from './services/application.service'

@Module({
  imports: [
    ConfigModule.forRoot(join(__dirname, '..', 'config.yml')),
    ConsulModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'applications')
    })
  ],
  controllers: [AppController],
  providers: [AppService, ApplicationService]
})
export class AppModule {
  constructor(private applicationService: ApplicationService) {}

  onApplicationBootstrap() {
    this.applicationService.register()
  }
}
