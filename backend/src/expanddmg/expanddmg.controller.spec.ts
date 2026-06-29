import { Test, TestingModule } from '@nestjs/testing';
import { ExpanddmgController } from './expanddmg.controller';

describe('ExpanddmgController', () => {
  let controller: ExpanddmgController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpanddmgController],
    }).compile();

    controller = module.get<ExpanddmgController>(ExpanddmgController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
