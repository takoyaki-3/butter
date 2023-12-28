const Butter = require('../src/fetch.js'); // 適切なパスを指定してください

describe('Butter Library', () => {
  describe('addNumbers function', () => {
    it('adds two numbers correctly', () => {
      expect(Butter.addNumbers(2, 3)).toBe(5);
      expect(Butter.addNumbers(-1, 1)).toBe(0);
      expect(Butter.addNumbers(0, 0)).toBe(0);
    });
  });

  describe('internal.distance function', () => {
    it('calculates the distance between two lat/lon correctly', () => {
      // 以下は東京（35.6895, 139.6917）と大阪（34.6937, 135.5022）間の距離を計算する例
      const distance = internal.distance(35.6895, 139.6917, 34.6937, 135.5022);
      expect(distance).toBeCloseTo(400, 0); // 約400km
    });

    it('returns 0 when the same points are given', () => {
      const distance = internal.distance(35.6895, 139.6917, 35.6895, 139.6917);
      expect(distance).toBe(0);
    });
  });

  // 他の関数に対するテストをここに追加...
});
