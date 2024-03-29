import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Application,
  ApplicationDocument,
} from '../schemas/application.schema';
import { Task, TaskDocument } from '../schemas/task.schema';
import { HttpService } from '@nestjs/axios';
import { task } from '../interfaces/task.interface';
import { AxiosError } from 'axios';

@Injectable()
export class DevService {
  // 注册Schema后，可以使用 @InjectModel() 装饰器将 User 模型注入到 UserService 中:
  constructor(
    @InjectModel('Application', 'applications')
    private applicationCol: Model<ApplicationDocument>,
    @InjectModel('Task', 'applications')
    private taskCol: Model<TaskDocument>,
    private readonly httpService: HttpService,
  ) {}

  getAxios() {
    return this.httpService.axiosRef;
  }

  async get(
    urlFn: () => string,
    thenFn: (res: any) => void,
    catchFn: (err: any) => void,
    retry: number = 1,
  ) {
    const retryMax = 10;
    return this.httpService.axiosRef
      .get(urlFn())
      .then(thenFn)
      .catch(async (e: AxiosError) => {
        console.log(`Retry ${retry}: ${e.config.url}`);
        if (retry >= retryMax) {
          console.log(`Retry failed: ${e.config.url}`);
          catchFn(e);
          return;
        }
        return await this.get(urlFn, thenFn, catchFn, retry + 1);
      });
  }

  async findAllApplication(): Promise<Application[]> {
    return this.applicationCol.find({}).exec();
  }

  async findAllTask(query: {
    Author?: string;
    Status?: string;
  }): Promise<Task[]> {
    return this.taskCol.find(query).exec();
  }

  async findTask(id: number): Promise<Task[]> {
    return this.taskCol.find({ _id: id }).exec();
  }

  async updateTask(id: number, update: any) {
    return this.taskCol.updateOne({ _id: id }, update);
  }

  async updateTaskMany(packageName: string, update: any) {
    return this.taskCol.updateMany({ Package: packageName }, update);
  }

  async insertTaskMany(taskList: task[]) {
    return this.taskCol.insertMany(taskList);
  }

  async insert(app: Application): Promise<ApplicationDocument> {
    return this.applicationCol.create(app);
  }

  async delete(packageName: string) {
    return this.applicationCol.deleteOne({ Package: packageName });
  }

  async update(packageName: string, update: any) {
    const updateValue = {};
    if (update.$set) {
      updateValue['$set'] = update.$set;
    }
    if (update.$unset) {
      updateValue['$unset'] = update.$unset;
    }
    //console.log(updateValue);
    return this.applicationCol.updateOne({ Package: packageName }, updateValue);
  }
}
