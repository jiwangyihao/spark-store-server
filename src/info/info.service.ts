import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class InfoService {
  constructor(private readonly httpService: HttpService) {}

  getAxios() {
    return this.httpService.axiosRef;
  }
}
