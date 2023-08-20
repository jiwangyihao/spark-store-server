import { Module } from '@nestjs/common';
import { RepoController } from './repo.controller';
import { RepoService } from './repo.service';
import { ApplicationSchema } from '../schemas/application.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: 'Application', schema: ApplicationSchema }],
      'applications',
    ),
    ElasticsearchModule.register({
      cloud: {
        id: 'My_deployment:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJGVhMjRlMDUwZmRlNTRmZThhYTZkZDY5ZGQ4MjA1ODQ2JDg3NTY1ZmQ5NTY5ZDRlOGZiNWNhZGM5OTdiZTEwZTg5',
      },
      auth: {
        username: 'elastic',
        password: process.env['elastic'],
      },
    }),
  ],
  controllers: [RepoController],
  providers: [RepoService],
})
export class RepoModule {}
