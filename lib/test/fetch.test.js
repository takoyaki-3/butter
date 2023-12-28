import Butter from '../src/fetch';

describe('Butter Library', () => {
  beforeAll(async () => {
    await Butter.init('https://s-ogawa.app.takoyaki3.com/v0.0.0/root.json');
  });

  describe('addNumbers function', () => {
    it('adds two numbers correctly', () => {
      expect(Butter.addNumbers(2, 3)).toBe(5);
      expect(Butter.addNumbers(-1, 1)).toBe(0);
      expect(Butter.addNumbers(0, 0)).toBe(0);
    });
  });

  describe('getHostDataList', () => {
    it('テストデータである都営バスのGTFSを取得できる', async () => {

      const hostList = await Butter.getHostDataList();

      expect(hostList[0].VehiclePosition_url).toBe('https://api-public.odpt.org/api/v4/gtfs/realtime/ToeiBus');
      expect(hostList[0].gtfs_id).toBe('ToeiBus');
      expect(hostList[0].license).toBe('CC BY 4.0公開元:東京都交通局・公共交通オープンデータ協議会');
      expect(hostList[0].name).toBe('東京都交通局');
      expect(hostList[0].providerUrl).toBe('https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip');
      expect(hostList[0].updatedAt).toBe('2023-12-28T00_00_00+09_00');
    })
  });
  
  describe('getHostDataList function', () => {
    it('retrieves the list of host data', async () => {
      const hostData = await Butter.getHostDataList();
      expect(Array.isArray(hostData)).toBe(true);
      expect(hostData.length).toBeGreaterThan(0);
    });
  });

  describe('getAgencyInfo function', () => {
    it('retrieves agency information for a given agency', async () => {
      const gtfsID = 'ToeiBus';
      const agencyInfo = await Butter.getAgencyInfo(gtfsID);
      expect(agencyInfo).toBeDefined();
      // expect(agencyInfo.agency_id).toBe(gtfsID);
    });
  });

  describe('getBusStops function', () => {
    it('retrieves bus stops for a given agency and version', async () => {
      const gtfsID = 'ToeiBus';
      const stops = await Butter.getBusStops(gtfsID);
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBeGreaterThan(0);
    });
  });

  describe('getTrips function', () => {
    it('retrieves trips for a given agency and version', async () => {
      const gtfsID = 'ToeiBus';
      const trips = await Butter.getTrips(gtfsID);
      expect(Array.isArray(trips)).toBe(true);
      expect(trips.length).toBeGreaterThan(0);
    });
  });

  describe('getVersionInfo function', () => {
    it('retrieves version information for a given agency', async () => {
      const gtfsID = 'ToeiBus';
      const versionInfo = await Butter.getVersionInfo(gtfsID);
      expect(versionInfo).toBeDefined();
    });
  });

  describe('getStopsBySubstring function', () => {
    it('retrieves stops containing a given substring', async () => {
      const substring = "かみ";
      const stops = await Butter.getStopsBySubstring(substring);
      expect(Array.isArray(stops)).toBe(true);
    });
  });

  describe('getStopsWithinRadius function', () => {
    it('retrieves stops within a certain radius of a given latitude and longitude', async () => {
      const lat = 35.693906;
      const lon = 139.701504;
      const radius = 500;
      const stops = await Butter.getStopsWithinRadius(lat, lon, radius);
      expect(Array.isArray(stops)).toBe(true);
      // 範囲内の停留所が含まれていることをチェック
    });
  });

  describe('getBusInfo function', () => {
    it('retrieves real-time bus information for a given location', async () => {
      const lat = 35.693906;
      const lon = 139.701504;
      const busInfo = await Butter.getBusInfo(lat, lon);
      expect(Array.isArray(busInfo)).toBe(true);
    });
  });

  describe('fetchTimeTableV1 function', () => {
    it('fetches timetable information for a given bus agency, date, and stop or trip IDs', async () => {
      const agencyId = 'ToeiBus';
      const queryParams = {
        date: "20230820",
        stop_ids: ['0605-07']
      };
      const tt = await Butter.fetchTimeTableV1(agencyId, queryParams);
      expect(tt).toBeDefined();
    });
  });

  describe('getComsumedOp function', () => {
    it('retrieves the number of operations consumed', async () => {
      const consumedOps = Butter.getComsumedOp();
      expect(typeof consumedOps).toBe('number');
    });
  });

  describe('getDataInfo function', () => {
    it('retrieves data information for a given agency', async () => {
      const agencyId = 'ToeiBus';
      const dataInfo = await Butter.getDataInfo(agencyId);
      expect(dataInfo).toBeDefined();
    });
  });

  describe('getHostUpdated function', () => {
    it('retrieves a list of updated hosts', async () => {
      const hostList = await Butter.getHostUpdated();
      expect(Array.isArray(hostList)).toBe(true);
    });
  });

  // describe('getStopsForBusPassingThrough function', () => {
  //   it('retrieves stops for buses passing through a specific route', async () => {
  //     const agencyId = 'ToeiBus';
  //     const routeId = '0955-01'; // 仮のルートID
  //     try{
  //       const stops = await Butter.getStopsForBusPassingThrough(agencyId, routeId);
  //       expect(Array.isArray(stops)).toBe(true);
  //     } catch (e) {
  //       console.log(e)
  //     }
  //   });
  // });
});
