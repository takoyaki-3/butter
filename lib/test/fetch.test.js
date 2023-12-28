import Butter from '../src/fetch';

describe('Butter Library', () => {
  describe('addNumbers function', () => {
    it('adds two numbers correctly', () => {
      expect(Butter.addNumbers(2, 3)).toBe(5);
      expect(Butter.addNumbers(-1, 1)).toBe(0);
      expect(Butter.addNumbers(0, 0)).toBe(0);
    });
  });

  describe('getHostDataList', () => {
    it('テストデータである都営バスのGTFSを取得できる', async () => {
      try {
        await Butter.init('https://s-ogawa.app.takoyaki3.com/v0.0.0/root.json');
        const hostList = await Butter.getHostDataList();

        expect(hostList[0].VehiclePosition_url).toBe('https://api-public.odpt.org/api/v4/gtfs/realtime/ToeiBus');
        expect(hostList[0].gtfs_id).toBe('ToeiBus');
        expect(hostList[0].license).toBe('CC BY 4.0公開元:東京都交通局・公共交通オープンデータ協議会');
        expect(hostList[0].name).toBe('東京都交通局');
        expect(hostList[0].providerUrl).toBe('https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip');
        expect(hostList[0].updatedAt).toBe('2023-12-28T00_00_00+09_00');
      } catch (e) {
        console.log(e);
        throw e;
      }
    })
  });

  // 他の関数に対するテストをここに追加...
});
