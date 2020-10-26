import * as Consul from 'consul';
import { ConfigService } from 'src/modules/config/services/config.service';
import { MD5 } from 'crypto-js';
import { getCurrentEnv, getIPAddress } from 'src/common';

export class ConsulService {
  public readonly consul: Consul.Consul;
  private serviceId: string;
  private serviceName: string;
  private servicePort: number;
  private serviceAddress: string;
  private serviceTags: string[];
  private checkInterval: string;
  private checkProtocol: string;
  private checkRouter: string;
  private checkTimeout: string;
  private checkMaxRetry: number;
  private checkRetryInterval: string;
  private checkDeregisterCriticalServiceAfter: string;

  /**
   * 构造函数
   */
  constructor(config: ConfigService) {
    // 创建consul
    this.consul = this.createConsul(config);
    // 加载service配置
    this.serviceName = config.get('service.name');
    this.servicePort = parseInt(config.get('service.port'), 10);
    this.serviceAddress = config.get('service.address', getIPAddress());
    this.serviceId = MD5(
      `${this.serviceName}@${this.serviceAddress}:${this.servicePort}`,
    ).toString();
    this.serviceTags = config
      .get('service.tags', ['api'])
      .concat([getCurrentEnv()]);
    // 加载check配置
    this.checkInterval = config.get('consul.check.interval', '10s');
    this.checkProtocol = config.get('consul.check.protocol', 'http');
    this.checkRouter = config.get('consul.check.router', '/health');
    this.checkTimeout = config.get('consul.check.timeout', '3s');
    this.checkMaxRetry = config.get('consul.check.maxRetry', 5);
    this.checkRetryInterval = config.get('consul.check.retryInterval', '5s');
    this.checkDeregisterCriticalServiceAfter = config.get(
      'consul.check.deregisterCriticalServiceAfter',
    );
  }

  /**
   * 创建Consul
   */
  private createConsul(config) {
    // 创建consul
    const consulConfig = config.get('consul');
    const option = { host: consulConfig.host, port: consulConfig.port };
    return new Consul({
      ...option,
      promisify: true,
    });
  }

  /**
   * 生成Consul配置信息
   */
  private generateRegisterOption() {
    // check配置信息
    const check = {
      http: `${this.checkProtocol}://${this.serviceAddress}:${this.servicePort}${this.checkRouter}`,
      interval: this.checkInterval,
      timeout: this.checkTimeout,
      maxRetry: this.checkMaxRetry,
      retryInterval: this.checkRetryInterval,
      deregistercriticalserviceafter: this.checkDeregisterCriticalServiceAfter,
    };

    // consul配置信息
    return {
      id: this.serviceId,
      name: this.serviceName,
      address: this.serviceAddress,
      port: this.servicePort,
      tags: this.serviceTags,
      check,
    };
  }

  /**
   * 注册Consul
   */
  public register() {
    const registerOption = this.generateRegisterOption();
    return this.consul.agent.service.register(registerOption);
  }

  /**
   * 查询服务信息
   * @param serviceName
   * @param serviceTags
   */
  public findServices(
    serviceName = undefined,
    serviceTags = [],
  ): Consul.Thenable<any> {
    return this.consul.agent.services().then(services => {
      // 通过Tag查找Service
      const findServiceByTag = service =>
        serviceTags.every(tag => service.Tags.includes(tag));

      // 通过Name查找Service
      const findServiceByName = service =>
        !serviceName || service.Service === serviceName;

      return Object.values(services).find(
        service => findServiceByTag(service) && findServiceByName(service),
      );
    });
  }
}
