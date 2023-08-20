import { Test, TestingModule } from '@nestjs/testing';
import { DevController } from './dev.controller';

describe('DevController', () => {
  let controller: DevController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevController],
    }).compile();

    controller = module.get<DevController>(DevController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
