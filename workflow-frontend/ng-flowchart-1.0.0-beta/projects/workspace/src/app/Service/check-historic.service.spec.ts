import { TestBed } from '@angular/core/testing';

import { CheckHistoricService } from './check-historic.service';

describe('CheckHistoricService', () => {
  let service: CheckHistoricService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckHistoricService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
