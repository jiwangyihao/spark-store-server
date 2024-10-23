import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://www.spark-app.store', //正式渠道
      'http://localhost:9000', //本地测试
      'https://spark.jwyihao.top', //Vercel 实时构建
      'https://jiwangyihao.github.io', //GitHub Pages 实时构建
      'https://deepin-community-store.gitee.io', //Gitee Pages 实时构建
    ],
  });
  await app.listen(3456);
}
bootstrap();
