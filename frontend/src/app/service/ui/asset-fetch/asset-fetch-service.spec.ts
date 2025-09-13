import { TestBed } from '@angular/core/testing';

import { AssetFetchService } from './asset-fetch-service';

describe('AssetFetchService', () => {
  let service: AssetFetchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetFetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
