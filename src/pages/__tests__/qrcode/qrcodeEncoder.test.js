import { describe, it, expect } from 'vitest';
import {
  getModeForText,
  getCharCountBits,
  getVersionSize,
  getTotalDataCodewords,
  encodeData,
  addErrorCorrection,
  initMatrix,
  calculateFormatInfo,
  calculateVersionInfo,
  copyMatrix,
  calculatePenalty,
  findMinVersion,
  generateQRCode,
  getModeForText as getModeForTextFn,
} from '@/pages/qrcode/qrcodeEncoder.js';
import { MODE, ERROR_CORRECTION_LEVELS } from '@/pages/qrcode/constants.js';

describe('QR Code Encoder', () => {
  describe('getModeForText', () => {
    it('should detect numeric mode', () => {
      expect(getModeForText('123456')).toBe(MODE.NUMERIC);
      expect(getModeForText('0')).toBe(MODE.NUMERIC);
      expect(getModeForText('9876543210')).toBe(MODE.NUMERIC);
    });

    it('should detect alphanumeric mode', () => {
      expect(getModeForText('HELLO')).toBe(MODE.ALPHANUMERIC);
      expect(getModeForText('ABC123')).toBe(MODE.ALPHANUMERIC);
      expect(getModeForText('HTTPS://EXAMPLE.COM')).toBe(MODE.ALPHANUMERIC);
      expect(getModeForText('$%*+-./:')).toBe(MODE.ALPHANUMERIC);
    });

    it('should detect byte mode for mixed content', () => {
      expect(getModeForText('Hello World')).toBe(MODE.BYTE);
      expect(getModeForText('hello')).toBe(MODE.BYTE);
      expect(getModeForText('https://example.com')).toBe(MODE.BYTE);
      expect(getModeForText('你好')).toBe(MODE.BYTE);
      expect(getModeForText('123abc')).toBe(MODE.BYTE);
    });
  });

  describe('getCharCountBits', () => {
    it('should return correct bits for numeric mode', () => {
      expect(getCharCountBits(MODE.NUMERIC, 1)).toBe(10);
      expect(getCharCountBits(MODE.NUMERIC, 9)).toBe(10);
      expect(getCharCountBits(MODE.NUMERIC, 10)).toBe(12);
      expect(getCharCountBits(MODE.NUMERIC, 26)).toBe(12);
      expect(getCharCountBits(MODE.NUMERIC, 27)).toBe(14);
      expect(getCharCountBits(MODE.NUMERIC, 40)).toBe(14);
    });

    it('should return correct bits for alphanumeric mode', () => {
      expect(getCharCountBits(MODE.ALPHANUMERIC, 1)).toBe(9);
      expect(getCharCountBits(MODE.ALPHANUMERIC, 9)).toBe(9);
      expect(getCharCountBits(MODE.ALPHANUMERIC, 10)).toBe(11);
      expect(getCharCountBits(MODE.ALPHANUMERIC, 26)).toBe(11);
      expect(getCharCountBits(MODE.ALPHANUMERIC, 27)).toBe(13);
      expect(getCharCountBits(MODE.ALPHANUMERIC, 40)).toBe(13);
    });

    it('should return correct bits for byte mode', () => {
      expect(getCharCountBits(MODE.BYTE, 1)).toBe(8);
      expect(getCharCountBits(MODE.BYTE, 9)).toBe(8);
      expect(getCharCountBits(MODE.BYTE, 10)).toBe(16);
      expect(getCharCountBits(MODE.BYTE, 26)).toBe(16);
      expect(getCharCountBits(MODE.BYTE, 27)).toBe(16);
      expect(getCharCountBits(MODE.BYTE, 40)).toBe(16);
    });
  });

  describe('getVersionSize', () => {
    it('should return correct matrix size for each version', () => {
      expect(getVersionSize(1)).toBe(21);
      expect(getVersionSize(2)).toBe(25);
      expect(getVersionSize(10)).toBe(57);
      expect(getVersionSize(40)).toBe(177);
    });
  });

  describe('getTotalDataCodewords', () => {
    it('should return correct number of data codewords', () => {
      expect(getTotalDataCodewords(1, ERROR_CORRECTION_LEVELS.L)).toBe(19);
      expect(getTotalDataCodewords(1, ERROR_CORRECTION_LEVELS.M)).toBe(16);
      expect(getTotalDataCodewords(1, ERROR_CORRECTION_LEVELS.Q)).toBe(13);
      expect(getTotalDataCodewords(1, ERROR_CORRECTION_LEVELS.H)).toBe(9);
      expect(getTotalDataCodewords(2, ERROR_CORRECTION_LEVELS.L)).toBe(34);
      expect(getTotalDataCodewords(5, ERROR_CORRECTION_LEVELS.M)).toBe(86);
    });
  });

  describe('encodeData', () => {
    it('should encode numeric data correctly', () => {
      const result = encodeData('123', MODE.NUMERIC, 1, ERROR_CORRECTION_LEVELS.L);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(19);
    });

    it('should encode alphanumeric data correctly', () => {
      const result = encodeData('HELLO', MODE.ALPHANUMERIC, 1, ERROR_CORRECTION_LEVELS.L);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(19);
    });

    it('should encode byte data correctly', () => {
      const result = encodeData('test', MODE.BYTE, 1, ERROR_CORRECTION_LEVELS.L);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(19);
    });

    it('should pad data to correct length', () => {
      const result = encodeData('1', MODE.NUMERIC, 1, ERROR_CORRECTION_LEVELS.L);
      expect(result.length).toBe(19);
    });
  });

  describe('addErrorCorrection', () => {
    it('should add error correction codewords', () => {
      const data = encodeData('test', MODE.BYTE, 1, ERROR_CORRECTION_LEVELS.L);
      const result = addErrorCorrection(data, 1, ERROR_CORRECTION_LEVELS.L);
      expect(result.length).toBe(26);
    });

    it('should handle version 1 with different EC levels', () => {
      const dataL = encodeData('123', MODE.NUMERIC, 1, ERROR_CORRECTION_LEVELS.L);
      const resultL = addErrorCorrection(dataL, 1, ERROR_CORRECTION_LEVELS.L);
      expect(resultL.length).toBe(26);

      const dataH = encodeData('1', MODE.NUMERIC, 1, ERROR_CORRECTION_LEVELS.H);
      const resultH = addErrorCorrection(dataH, 1, ERROR_CORRECTION_LEVELS.H);
      expect(resultH.length).toBe(26);
    });
  });

  describe('initMatrix', () => {
    it('should create correct size matrix filled with null', () => {
      const size = 21;
      const matrix = initMatrix(size);
      expect(matrix.length).toBe(size);
      expect(matrix[0].length).toBe(size);
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          expect(matrix[r][c]).toBeNull();
        }
      }
    });
  });

  describe('calculateFormatInfo', () => {
    it('should calculate format info for different EC levels and masks', () => {
      for (const ec of Object.values(ERROR_CORRECTION_LEVELS)) {
        for (let mask = 0; mask < 8; mask++) {
          const info = calculateFormatInfo(ec, mask);
          expect(typeof info).toBe('number');
          expect(info).toBeGreaterThanOrEqual(0);
          expect(info).toBeLessThan(1 << 15);
        }
      }
    });
  });

  describe('calculateVersionInfo', () => {
    it('should calculate version info for versions >= 7', () => {
      for (let v = 7; v <= 40; v++) {
        const info = calculateVersionInfo(v);
        expect(typeof info).toBe('number');
        expect(info).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('copyMatrix', () => {
    it('should create a deep copy of the matrix', () => {
      const original = [
        [true, false],
        [false, true],
      ];
      const copy = copyMatrix(original);
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy[0]).not.toBe(original[0]);
    });
  });

  describe('findMinVersion', () => {
    it('should find correct version for short text', () => {
      expect(findMinVersion('Hello', ERROR_CORRECTION_LEVELS.M)).toBeGreaterThanOrEqual(1);
      expect(findMinVersion('Hello', ERROR_CORRECTION_LEVELS.M)).toBeLessThanOrEqual(10);
    });

    it('should find higher version for longer text', () => {
      const longText = 'A'.repeat(100);
      const version1 = findMinVersion('A', ERROR_CORRECTION_LEVELS.M);
      const version2 = findMinVersion(longText, ERROR_CORRECTION_LEVELS.M);
      expect(version2).toBeGreaterThan(version1);
    });

    it('should account for error correction level', () => {
      const text = 'A'.repeat(20);
      const versionL = findMinVersion(text, ERROR_CORRECTION_LEVELS.L);
      const versionH = findMinVersion(text, ERROR_CORRECTION_LEVELS.H);
      expect(versionH).toBeGreaterThanOrEqual(versionL);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code for simple text', () => {
      const result = generateQRCode('Hello', ERROR_CORRECTION_LEVELS.M);
      expect(result).toBeDefined();
      expect(result.matrix).toBeDefined();
      expect(Array.isArray(result.matrix)).toBe(true);
      expect(result.matrix.length).toBe(result.size);
      expect(result.mode).toBeDefined();
      expect(result.version).toBeGreaterThanOrEqual(1);
      expect(result.version).toBeLessThanOrEqual(40);
      expect(result.ecLevel).toBe(ERROR_CORRECTION_LEVELS.M);
    });

    it('should generate QR code for URL', () => {
      const result = generateQRCode('https://example.com', ERROR_CORRECTION_LEVELS.Q);
      expect(result).toBeDefined();
      expect(result.matrix.length).toBe(result.size);
    });

    it('should generate QR code with numeric mode', () => {
      const result = generateQRCode('1234567890', ERROR_CORRECTION_LEVELS.L);
      expect(result.mode).toBe(MODE.NUMERIC);
    });

    it('should generate valid matrix with correct dimensions', () => {
      const result = generateQRCode('test', ERROR_CORRECTION_LEVELS.M);
      expect(result.matrix.length).toBe(getVersionSize(result.version));
      for (const row of result.matrix) {
        expect(row.length).toBe(getVersionSize(result.version));
      }
    });

    it('should only contain boolean values in matrix', () => {
      const result = generateQRCode('test', ERROR_CORRECTION_LEVELS.M);
      for (const row of result.matrix) {
        for (const cell of row) {
          expect(typeof cell).toBe('boolean');
        }
      }
    });
  });
});
