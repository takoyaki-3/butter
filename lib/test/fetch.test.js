const Butter = require('../src/fetch').default; // 適切なパスを指定してください
const internal = require('../src/internal').default; // 適切なパスを指定してください

console.log(Butter);

console.log(Butter);

describe('Butter Library', () => {
  describe('addNumbers function', () => {
    it('adds two numbers correctly', () => {
      expect(Butter.addNumbers(2, 3)).toBe(5);
      expect(Butter.addNumbers(-1, 1)).toBe(0);
      expect(Butter.addNumbers(0, 0)).toBe(0);
    });
  });

  // describe('getHostDataList', () => {
  //   it('test', async () => {
  //     try {
  //       await Butter.init('https://s-ogawa.app.takoyaki3.com/v0.0.0/root.json');
  //       const hostList = await Butter.getHostDataList();
  //       console.log('hostList',hostList);
  //       expect(hostList).toContain(['https://s-ogawa.app.takoyaki3.com/v0.0.0']);  
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   });
  // });

  // 他の関数に対するテストをここに追加...
});
