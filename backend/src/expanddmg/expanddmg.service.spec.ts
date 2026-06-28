import { Test, TestingModule } from '@nestjs/testing';
import { ExpanddmgService } from './expanddmg.service';

describe('ExpanddmgService', () => {
  let service: ExpanddmgService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpanddmgService],
    }).compile();

    service = module.get<ExpanddmgService>(ExpanddmgService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
