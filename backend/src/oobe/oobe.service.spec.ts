import { Test, TestingModule } from '@nestjs/testing';
import { OobeService } from './oobe.service';

describe('OobeService', () => {
  let service: OobeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OobeService],
    }).compile();

    service = module.get<OobeService>(OobeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
