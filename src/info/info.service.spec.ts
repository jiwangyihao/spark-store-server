import { Test, TestingModule } from '@nestjs/testing';
import { InfoService } from './info.service';

describe('InfoService', () => {
  let service: InfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfoService],
    }).compile();

    service = module.get<InfoService>(InfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
