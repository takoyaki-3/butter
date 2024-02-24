import Butter from '../src/fetch';

const STORAGE_ENDPOINT = 'https://test-data.butter.takoyaki3.com/v0.0.0';

describe('Butter Library', () => {
  beforeAll(async () => {
    await Butter.init(STORAGE_ENDPOINT+'/root.json');
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

      expect(Array.isArray(hostList)).toBe(true);
      expect(hostList.length).toBe(1);
      expect(hostList[0].VehiclePosition_url).toBe('https://api-public.odpt.org/api/v4/gtfs/realtime/ToeiBus');
      expect(hostList[0].gtfs_id).toBe('ToeiBus');
      expect(hostList[0].license).toBe('CC BY 4.0公開元:東京都交通局・公共交通オープンデータ協議会');
      expect(hostList[0].name).toBe('東京都交通局');
      expect(hostList[0].providerUrl).toBe('https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip');
      expect(hostList[0].updatedAt).toBe('2023-12-28T00_00_00+09_00');
    })
  });

  describe('getAgencyInfo function', () => {
    it('指定したGTFS_IDにおけるバージョン情報やハッシュ長情報を取得できること', async () => {
      const gtfsID = 'ToeiBus';
      const agencyInfo = await Butter.getAgencyInfo(gtfsID);
      expect(agencyInfo).toBeDefined();
      expect(agencyInfo).toEqual([{
        version_id: '2023-12-28T15_11_54+09_00',
        by_stop_hash_value_size: 2,
        by_trip_hash_value_size: 2
      }]);
    });
  });

  describe('getBusStops function', () => {
    it('指定したGTFS_IDに含まれる停留所情報を取得できること', async () => {
      const gtfsID = 'ToeiBus';
      const stops = await Butter.getBusStops(gtfsID);
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBe(3717);
    });
  });

  describe('getTrips function', () => {
    it('指定したGTFS_IDに含まれる旅程情報を取得できること', async () => {
      const gtfsID = 'ToeiBus';
      const trips = await Butter.getTrips(gtfsID);
      expect(Array.isArray(trips)).toBe(true);
      expect(trips.length).toBe(64797);
    });
  });

  describe('getVersionInfo function', () => {
    it('指定したGTFS_IDのバージョンにおいて、ハッシュ長情報を取得できること', async () => {
      const gtfsID = 'ToeiBus';
      const versionInfo = await Butter.getVersionInfo(gtfsID);
      expect(versionInfo).toEqual({ by_stop_hash_value_size: 2, by_trip_hash_value_size: 2 });
    });
  });

  describe('getStopsBySubstring function', () => {
    it('検索ワードが名称に含まれる停留所一覧が取得できること', async () => {
      const substring = "東京国際";
      const stops = await Butter.getStopsBySubstring(substring);
      expect(Array.isArray(stops)).toBe(true);
      expect(stops).toEqual([
        {
          stop_id: '0302-01',
          stop_code: '',
          stop_name: '東京国際クルーズターミナル駅前',
          stop_desc: 'ゆりかもめ 船の科学館',
          stop_lat: '35.622328',
          stop_lon: '139.772184',
          zone_id: '0302-01',
          stop_url: 'https://tobus.jp/blsys/navi?LCD=&VCD=cresultrsi&ECD=aprslt&slst=302',
          location_type: '0',
          parent_station: '',
          stop_timezone: '',
          wheelchair_boarding: '',
          platform_code: '',
          gtfs_id: 'ToeiBus'
        },
        {
          stop_id: '0302-02',
          stop_code: '',
          stop_name: '東京国際クルーズターミナル駅前',
          stop_desc: 'ゆりかもめ 船の科学館',
          stop_lat: '35.621659',
          stop_lon: '139.77305800000002',
          zone_id: '0302-02',
          stop_url: 'https://tobus.jp/blsys/navi?LCD=&VCD=cresultrsi&ECD=aprslt&slst=302',
          location_type: '0',
          parent_station: '',
          stop_timezone: '',
          wheelchair_boarding: '',
          platform_code: '',
          gtfs_id: 'ToeiBus'
        },
        {
          stop_id: '0302-03',
          stop_code: '',
          stop_name: '東京国際クルーズターミナル駅前',
          stop_desc: 'ゆりかもめ 船の科学館',
          stop_lat: '35.621057',
          stop_lon: '139.774762',
          zone_id: '0302-03',
          stop_url: 'https://tobus.jp/blsys/navi?LCD=&VCD=cresultrsi&ECD=aprslt&slst=302',
          location_type: '0',
          parent_station: '',
          stop_timezone: '',
          wheelchair_boarding: '',
          platform_code: '',
          gtfs_id: 'ToeiBus'
        },
        {
          stop_id: '1008-01',
          stop_code: '',
          stop_name: '東京国際フォーラム前',
          stop_desc: '',
          stop_lat: '35.678492999999996',
          stop_lon: '139.763491',
          zone_id: '1008-01',
          stop_url: 'https://tobus.jp/blsys/navi?LCD=&VCD=cresultrsi&ECD=aprslt&slst=1008',
          location_type: '0',
          parent_station: '',
          stop_timezone: '',
          wheelchair_boarding: '',
          platform_code: '',
          gtfs_id: 'ToeiBus'
        },
        {
          stop_id: '1008-03',
          stop_code: '',
          stop_name: '東京国際フォーラム前',
          stop_desc: '',
          stop_lat: '35.677469',
          stop_lon: '139.76334599999998',
          zone_id: '1008-03',
          stop_url: 'https://tobus.jp/blsys/navi?LCD=&VCD=cresultrsi&ECD=aprslt&slst=1008',
          location_type: '0',
          parent_station: '',
          stop_timezone: '',
          wheelchair_boarding: '',
          platform_code: '',
          gtfs_id: 'ToeiBus'
        }
      ]);
    });
  });

  describe('getStopsWithinRadius function', () => {
    it('緯度、経度、半径を与えると該当する停留所のリストを返すこと', async () => {
      const lat = 35.693906;
      const lon = 139.701504;
      const radius = 100;
      const stops = await Butter.getStopsWithinRadius(lat, lon, radius);
      expect(Array.isArray(stops)).toBe(true);
      expect(stops).toEqual([
        {
          stop_id: '0334-02',
          stop_code: '',
          stop_name: '歌舞伎町',
          stop_desc: '西武新宿線 西武新宿',
          stop_lat: '35.693613',
          stop_lon: '139.70199',
          zone_id: '0334-02',
          stop_url: 'https://tobus.jp/blsys/navi?LCD=&VCD=cresultrsi&ECD=aprslt&slst=334',
          location_type: '0',
          parent_station: '',
          stop_timezone: '',
          wheelchair_boarding: '',
          platform_code: '',
          gtfs_id: 'ToeiBus',
          h3index: '872f5a375ffffff'
        },
        {
          stop_id: '0334-03',
          stop_code: '',
          stop_name: '歌舞伎町',
          stop_desc: '西武新宿線 西武新宿',
          stop_lat: '35.693269',
          stop_lon: '139.70191699999998',
          zone_id: '0334-03',
          stop_url: 'https://tobus.jp/blsys/navi?LCD=&VCD=cresultrsi&ECD=aprslt&slst=334',
          location_type: '0',
          parent_station: '',
          stop_timezone: '',
          wheelchair_boarding: '',
          platform_code: '',
          gtfs_id: 'ToeiBus',
          h3index: '872f5a375ffffff'
        }
      ]);
    });
  });

  describe('getBusInfo function', () => {
    it('緯度経度を基にバス一覧を返すこと', async () => {
      const lat = 35.693906;
      const lon = 139.701504;
      const busInfo = await Butter.getBusInfo(lat, lon);
      expect(Array.isArray(busInfo)).toBe(true);

      // busInfo.forEach(buses => {
      //   buses.forEach(bus => {
      //     console.log(bus);
      //     console.log(JSON.stringify(bus));
      //   });
      // });
    });
  });

  describe('fetchTimeTableV1 function', () => {
    it('fetches timetable information for a given bus agency, date, and stop or trip IDs', async () => {
      const agencyId = 'ToeiBus';
      const queryParams = {
        date: "20231231",
        stop_ids: ['0605-07']
      };
      const tt = await Butter.fetchTimeTableV1(agencyId, queryParams);
      expect(tt).toEqual( {
        stop_times: [
          {
            trip_id: '04301-1-06-100-0705',
            stop_id: '0605-07',
            arrival_time: '07:05:00',
            departure_time: '07:05:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-0730',
            stop_id: '0605-07',
            arrival_time: '07:52:00',
            departure_time: '07:52:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-1-06-100-0805',
            stop_id: '0605-07',
            arrival_time: '08:05:00',
            departure_time: '08:05:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-0830',
            stop_id: '0605-07',
            arrival_time: '08:52:00',
            departure_time: '08:52:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-1-06-100-0905',
            stop_id: '0605-07',
            arrival_time: '09:05:00',
            departure_time: '09:05:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-0930',
            stop_id: '0605-07',
            arrival_time: '09:52:00',
            departure_time: '09:52:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-1-06-100-1005',
            stop_id: '0605-07',
            arrival_time: '10:05:00',
            departure_time: '10:05:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-1030',
            stop_id: '0605-07',
            arrival_time: '10:53:00',
            departure_time: '10:53:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04302-2-06-100-1053',
            stop_id: '0605-07',
            arrival_time: '10:53:00',
            departure_time: '10:53:00',
            headsign: '港南四丁目',
            stop_headsign: '港南四丁目',
            trip_headsign: '港南四丁目',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-1-06-100-1506',
            stop_id: '0605-07',
            arrival_time: '15:06:00',
            departure_time: '15:06:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-1531',
            stop_id: '0605-07',
            arrival_time: '15:54:00',
            departure_time: '15:54:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-1-06-100-1606',
            stop_id: '0605-07',
            arrival_time: '16:06:00',
            departure_time: '16:06:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-1631',
            stop_id: '0605-07',
            arrival_time: '16:54:00',
            departure_time: '16:54:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-1-06-100-1706',
            stop_id: '0605-07',
            arrival_time: '17:06:00',
            departure_time: '17:06:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-1731',
            stop_id: '0605-07',
            arrival_time: '17:53:00',
            departure_time: '17:53:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-1-06-100-1806',
            stop_id: '0605-07',
            arrival_time: '18:06:00',
            departure_time: '18:06:00',
            headsign: '田町駅東口',
            stop_headsign: '田町駅東口',
            trip_headsign: '田町駅東口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04301-2-06-100-1831',
            stop_id: '0605-07',
            arrival_time: '18:53:00',
            departure_time: '18:53:00',
            headsign: '品川駅港南口',
            stop_headsign: '品川駅港南口',
            trip_headsign: '品川駅港南口',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          },
          {
            trip_id: '04302-2-06-100-1853',
            stop_id: '0605-07',
            arrival_time: '18:53:00',
            departure_time: '18:53:00',
            headsign: '港南四丁目',
            stop_headsign: '港南四丁目',
            trip_headsign: '港南四丁目',
            stop_name: '品川駅港南口',
            predict_time: 'NOT IMPLEMENTED'
          }
        ],
        properties: 'NOT IMPLEMENTED'
      });
    });
  });

  describe('getComsumedOp function', () => {
    it('retrieves the number of operations consumed', async () => {
      const consumedOps = Butter.getComsumedOp();
      expect(typeof consumedOps).toBe('number');
      expect(consumedOps).toBe(11);
    });
  });

  describe('getDataInfo function', () => {
    it('retrieves data information for a given agency', async () => {
      const agencyId = 'ToeiBus';
      const dataInfo = await Butter.getDataInfo(agencyId);
      expect(dataInfo).toBeDefined();
      expect(dataInfo).toEqual({
        gtfs_id: 'ToeiBus',
        agency_id: '',
        name: '東京都交通局',
        license: 'CC BY 4.0公開元:東京都交通局・公共交通オープンデータ協議会',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        providerUrl: 'https://api-public.odpt.org/api/v4/files/Toei/data/ToeiBus-GTFS.zip',
        providerName: '',
        providerAgencyName: '',
        memo: '',
        updatedAt: '2023-12-28T00_00_00+09_00',
        VehiclePosition_url: 'https://api-public.odpt.org/api/v4/gtfs/realtime/ToeiBus'
      });
    });
  });

  describe('getHostUpdated function', () => {
    it('retrieves a list of updated hosts', async () => {
      const hostList = await Butter.getHostUpdated();
      expect(Array.isArray(hostList)).toBe(true);
      expect(hostList.length).toBe(1);
      expect(JSON.stringify(hostList)).toEqual('[{\"host\":\"'+STORAGE_ENDPOINT+'\",\"updated\":\"2023-12-28T06:18:11.000Z\"}]');
    });
  });

  // getAgencyのテスト
  describe('getAgency function', () => {
    it('retrieves agency information for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const agency = await Butter.getAgency(gtfsID);
      expect(Array.isArray(agency)).toBe(true);
      // 事業者の名前や他の情報に関する検証を行う
    });
  });
  
  // getCalendarのテスト
  describe('getCalendar function', () => {
    it('retrieves calendar information for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const calendar = await Butter.getCalendar(gtfsID);
      expect(Array.isArray(calendar)).toBe(true);
      // カレンダー情報に関する詳細な検証を行う
    });
  });

  // getCalendarDatesのテスト
  describe('getCalendarDates function', () => {
    it('retrieves calendar dates information for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const calendarDates = await Butter.getCalendarDates(gtfsID);
      expect(Array.isArray(calendarDates)).toBe(true);
      // カレンダー日付情報に関する詳細な検証を行う
    });
  });

  // getFareAttributesのテスト
  describe('getFareAttributes function', () => {
    it('retrieves fare attributes for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const fareAttributes = await Butter.getFareAttributes(gtfsID);
      expect(Array.isArray(fareAttributes)).toBe(true);
      // 運賃属性に関する詳細な検証を行う
    });
  });
  
  // getFareRulesのテスト
  describe('getFareRules function', () => {
    it('retrieves fare rules for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const fareRules = await Butter.getFareRules(gtfsID);
      expect(Array.isArray(fareRules)).toBe(true);
      // 運賃ルールに関する詳細な検証を行う
    });
  });

  // getFeedInfoのテスト
  describe('getFeedInfo function', () => {
    it('retrieves feed information for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const feedInfo = await Butter.getFeedInfo(gtfsID);
      expect(Array.isArray(feedInfo)).toBe(true);
      // フィード情報に関する詳細な検証を行う
    });
  });

  // getOfficeJpのテスト
  describe('getOfficeJp function', () => {
    it('retrieves office information in Japanese for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const officeJp = await Butter.getOfficeJp(gtfsID);
      expect(Array.isArray(officeJp)).toBe(true);
      // 事業者情報（日本語）に関する詳細な検証を行う
    });
  });

  // getRoutesのテスト
  describe('getRoutes function', () => {
    it('retrieves route information for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const routes = await Butter.getRoutes(gtfsID);
      expect(Array.isArray(routes)).toBe(true);
      // 路線情報に関する詳細な検証を行う
    });
  });

  // getShapesのテスト
  describe('getShapes function', () => {
    it('retrieves shape information for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const shapes = await Butter.getShapes(gtfsID);
      expect(Array.isArray(shapes)).toBe(true);
      // シェイプ情報に関する詳細な検証を行う
    });
  });

  // // getStopTimesのテスト
  // describe('getStopTimes function', () => {
  //   it('retrieves stop times information for a given GTFS ID', async () => {
  //     const gtfsID = 'ToeiBus';
  //     const stopTimes = await Butter.getStopTimes(gtfsID);
  //     expect(Array.isArray(stopTimes)).toBe(true);
  //     // 停留所時刻情報に関する詳細な検証を行う
  //     console.info(stopTimes)
  //   });
  // });

  // // getTransfersのテスト
  // describe('getTransfers function', () => {
  //   it('retrieves transfer information for a given GTFS ID', async () => {
  //     const gtfsID = 'ToeiBus';
  //     const transfers = await Butter.getTransfers(gtfsID);
  //     expect(Array.isArray(transfers)).toBe(true);
  //     // 乗り換え情報に関する詳細な検証を行う
  //   });
  // });

  // getTranslationsのテスト
  describe('getTranslations function', () => {
    it('retrieves translation information for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const translations = await Butter.getTranslations(gtfsID);
      expect(Array.isArray(translations)).toBe(true);
      // 翻訳情報に関する詳細な検証を行う
    });
  });

  // getServiceIDsのテスト
  describe('getServiceIDs function', () => {
    it('retrieves service IDs for a given GTFS ID and date', async () => {
      const gtfsID = 'ToeiBus';
      const versionID = null;
      const dateStr = '20231231';
      const serviceIDs = await Butter.getServiceIDs(gtfsID, versionID, dateStr);
      expect(Array.isArray(serviceIDs)).toBe(true);
      // サービスIDに関する詳細な検証を行う
    });
  });

  // findTripsのテスト
  describe('findTrips function', () => {
    it('retrieves trip IDs for given stop IDs', async () => {
      const gtfsID = 'ToeiBus';
      const versionID = null;
      const stopIDs = ['0605-07', '0605-08']; // 例の停留所ID
      const tripIDs = await Butter.findTrips(gtfsID, versionID, stopIDs);
      expect(Array.isArray(tripIDs)).toBe(true);
      // 交差するトリップIDに関する詳細な検証を行う
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
  describe('getRealTimePositionsByGtfsId function', () => {
    it('retrieves real-time positions for a given GTFS ID', async () => {
      const gtfsID = 'ToeiBus';
      const positions = await Butter.getRealTimePositionsByGtfsId(gtfsID);
      expect(Array.isArray(positions)).toBe(true);
    });
  });

  describe('getRealTimePositionsByLatLon function', () => {
    it('retrieves real-time positions for a given route ID', async () => {
      const positions = await Butter.getRealTimePositionsByLatLon(35.622328,139.772184);
      expect(Array.isArray(positions)).toBe(true);
    });
  });
});
