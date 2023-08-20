import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '这是一个基于 Nest.js + MongoDB 的星火应用商店后端项目';
  }

  robot(): string {
    return `User-agent: *
    Disallow: /`;
  }
}
