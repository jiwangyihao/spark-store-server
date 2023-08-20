import { Controller, Get, Query } from '@nestjs/common';
import { InfoService } from './info.service';
import { updateItem } from '../interfaces/update-item.interface';
let jsdom: any;
jsdom = require('jsdom');
const { JSDOM } = jsdom;

@Controller('info')
export class InfoController {
  constructor(private readonly infoService: InfoService) {}
  @Get('latest')
  async latest() {
    const config = {
      repository: 'https://gitee.com/deepin-community-store/spark-store',
    };
    const response = (
      await this.infoService
        .getAxios()
        .get(`${config.repository}/releases/latest`)
    ).data;
    const doc = new JSDOM(response).window.document;

    let details: string[] = [];
    doc
      .querySelectorAll('.release-body .content .markdown-body li')
      .forEach((el: any) => details.push(el.textContent!));

    return {
      version: doc
        .querySelector('.release-meta .tag-name')
        ?.textContent?.trimStart()
        .trimEnd(),
      time: doc
        .querySelector('.release-meta .release-time')
        ?.textContent?.trimStart()
        .trimEnd(),
      details: details,
    };
  }
  @Get('history')
  async history(@Query('page') page: string) {
    const config = {
      repository: 'https://gitee.com/deepin-community-store/spark-store',
    };
    const response = (
      await this.infoService
        .getAxios()
        .get(`${config.repository}/releases?page=${page}`)
    ).data;
    const doc = new JSDOM(response).window.document;

    let updateHistory: updateItem[] = [];

    doc.querySelectorAll('.release-tag-item').forEach((item: any) => {
      let details: string[] = [];
      item
        .querySelectorAll('.release-body .content .markdown-body li')
        .forEach((el: any) => details.push(el.textContent!));

      const result = {
        version: item
          .querySelector('.release-meta .tag-name')
          ?.textContent?.trimStart()
          .trimEnd(),
        time: item
          .querySelector('.release-meta .release-time')
          ?.textContent?.trimStart()
          .trimEnd(),
        details: details,
      };

      if (!item.querySelector('.pre-version')) {
        updateHistory.push(result);
      }
    });

    return {
      status: response.status,
      isEnded:
        doc.querySelector('.pagination>:last-child')?.textContent === page,
      data: updateHistory,
    };
  }
}
