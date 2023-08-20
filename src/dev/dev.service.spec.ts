import { Test, TestingModule } from '@nestjs/testing';
import { DevService } from './dev.service';

describe('DevService', () => {
  let service: DevService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevService],
    }).compile();

    service = module.get<DevService>(DevService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
