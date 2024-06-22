import { Controller, Get, Query } from '@nestjs/common';
import { RepoService } from './repo.service';
import { Application } from '../schemas/application.schema';

@Controller('repo')
export class RepoController {
  constructor(private readonly repoService: RepoService) {}
/*
  @Get('getAppList')
  async getAppList(
    @Query('sort') sort: string,
    @Query('tag') tag: string,
  ): Promise<Application[]> {
    interface listQuery {
      Sort?: string;
      Tags?: string;
      History: boolean | undefined;
    }
    const query: listQuery = {
      History: undefined,
    };
    if (sort) {
      query.Sort = sort;
    }
    if (tag) {
      query.Tags = tag;
    }
    return this.repoService.findAll(query);
  }

  @Get('getAppDetail')
  async getAppDetail(
    @Query('package') packageName: string,
  ): Promise<Application[]> {
    return this.repoService.findOne({ Package: packageName });
  }

  @Get('search')
  async search(@Query('keyword') keyword: string) {
    return this.repoService.search(keyword);
  }
*/
}
