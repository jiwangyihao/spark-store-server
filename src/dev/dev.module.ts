import { Module } from '@nestjs/common';
import { DevService } from './dev.service';
import { DevController } from './dev.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationSchema } from '../schemas/application.schema';
import { TaskSchema } from '../schemas/task.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: 'Application', schema: ApplicationSchema }],
      'applications',
    ),
    MongooseModule.forFeature(
      [{ name: 'Task', schema: TaskSchema }],
      'applications',
    ),
    HttpModule,
  ],
  providers: [DevService],
  controllers: [DevController],
})
export class DevModule {}
