import { Test, TestingModule } from '@nestjs/testing';
import { OobeController } from './oobe.controller';

describe('OobeController', () => {
  let controller: OobeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OobeController],
    }).compile();

    controller = module.get<OobeController>(OobeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
