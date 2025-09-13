import { FetchAssetPipe } from './asset-fetch-pipe';
import { AssetFetchService } from '../../../service/ui/asset-fetch/asset-fetch-service';

describe('FetchAssetPipe', () => {
  it('create an instance', () => {
    const mockAssetFetchService = {} as AssetFetchService;
    const pipe = new FetchAssetPipe(mockAssetFetchService);
    expect(pipe).toBeTruthy();
  });
});