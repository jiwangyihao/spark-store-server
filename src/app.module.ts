import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RepoModule } from './repo/repo.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DevModule } from './dev/dev.module';
import { InfoModule } from './info/info.module';

@Module({
  imports: [
    RepoModule,
    MongooseModule.forRoot(
      process.env['MongoDB'].replace('/?', '/applications?'), //更改 Collection
      {
        connectionName: 'applications',
      },
    ),
    DevModule,
    InfoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
