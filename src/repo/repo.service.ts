import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ApplicationDocument,
  Application,
} from '../schemas/application.schema';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class RepoService {
  // 注册Schema后，可以使用 @InjectModel() 装饰器将 User 模型注入到 UserService 中:
  constructor(
    @InjectModel('Application', 'applications')
    private applicationCol: Model<ApplicationDocument>,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}
  // 查找
  async findAll(query: {
    Sort?: string;
    Tags?: string;
    History: boolean | undefined;
  }): Promise<Application[]> {
    // 这里是异步的
    return this.applicationCol
      .find(query, {
        Package: 1,
        Name: 1,
        More: 1,
        Sort: 1,
      })
      .exec();
  }
  // 查找
  async findOne(query: { Package: string }): Promise<Application[]> {
    // 这里是异步的
    return this.applicationCol.find(query);
  }

  async search(keyword: string) {
    return this.elasticsearchService.search({
      query: {
        bool: {
          should: [
            {
              match: {
                Name: keyword,
              },
            },
            {
              match: {
                More: keyword,
              },
            },
          ],
          must_not: {
            match: {
              History: true,
            },
          },
        },
      },
      filter_path:
        'took,hits.hits._id,hits.hits._score,hits.hits._source.Name,hits.hits._source.More',
      size: 1000,
    });
  }
}
