import { Test, TestingModule } from '@nestjs/testing';
import { LicensesController } from './licenses.controller';

describe('LicensesController', () => {
  let controller: LicensesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LicensesController],
    }).compile();

    controller = module.get<LicensesController>(LicensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
