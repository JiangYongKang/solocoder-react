import { describe, it, expect } from 'vitest';
import {
  imageToGrayscale,
  binarize,
  getVersionSize,
  readFormatInfo,
  unmaskGrid,
  readDataCodewords,
  rsDecode,
  extractDataBlocks,
  decodeData,
} from '@/pages/qrcode/qrcodeDecoder.js';
import { generateQRCode, getModeForText } from '@/pages/qrcode/qrcodeEncoder.js';
import { ERROR_CORRECTION_LEVELS, MODE } from '@/pages/qrcode/constants.js';

function decodeQRFromGenerated(qr) {
  const formatInfo = readFormatInfo(qr.matrix);
  expect(formatInfo).not.toBeNull();
  const unmasked = unmaskGrid(qr.matrix, formatInfo.maskIndex, qr.version);
  const codewords = readDataCodewords(unmasked, qr.version);
  const dataBytes = extractDataBlocks(codewords, qr.version, formatInfo.ecLevel);
  expect(dataBytes).not.toBeNull();
  return decodeData(dataBytes, qr.version);
}

describe('QR Code Decoder', () => {
  describe('imageToGrayscale', () => {
    it('should convert RGBA image data to grayscale', () => {
      const width = 2;
      const height = 2;
      const data = new Uint8ClampedArray([
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
        255, 255, 255, 255,
      ]);
      const imageData = { width, height, data };
      const result = imageToGrayscale(imageData);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.gray.length).toBe(width * height);

      expect(result.gray[0]).toBeCloseTo(76, 0);
      expect(result.gray[1]).toBeCloseTo(149, 0);
      expect(result.gray[2]).toBeCloseTo(29, 0);
      expect(result.gray[3]).toBe(255);
    });

    it('should handle pure black and white', () => {
      const width = 1;
      const height = 2;
      const data = new Uint8ClampedArray([
        0, 0, 0, 255,
        255, 255, 255, 255,
      ]);
      const imageData = { width, height, data };
      const result = imageToGrayscale(imageData);

      expect(result.gray[0]).toBe(0);
      expect(result.gray[1]).toBe(255);
    });
  });

  describe('binarize', () => {
    it('should binarize grayscale data', () => {
      const width = 2;
      const height = 2;
      const gray = new Uint8ClampedArray([0, 100, 200, 255]);
      const grayData = { gray, width, height };
      const result = binarize(grayData);

      expect(result.width).toBe(width);
      expect(result.height).toBe(height);
      expect(result.binary.length).toBe(width * height);
      expect(result.binary[0]).toBe(1);
      expect(result.binary[3]).toBe(0);
    });

    it('should use mean threshold', () => {
      const width = 1;
      const height = 4;
      const gray = new Uint8ClampedArray([10, 20, 80, 90]);
      const grayData = { gray, width, height };
      const result = binarize(grayData);

      expect(result.binary.filter((b) => b === 1).length).toBe(2);
      expect(result.binary.filter((b) => b === 0).length).toBe(2);
    });
  });

  describe('getVersionSize', () => {
    it('should return correct size for all versions', () => {
      expect(getVersionSize(1)).toBe(21);
      expect(getVersionSize(2)).toBe(25);
      expect(getVersionSize(10)).toBe(57);
      expect(getVersionSize(40)).toBe(177);
    });
  });

  describe('decodeData - Numeric mode (low version)', () => {
    it('should decode short numeric data (version 1)', () => {
      const testText = '12345';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(qr.version).toBeLessThanOrEqual(9);
      expect(getModeForText(testText)).toBe(MODE.NUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode longer numeric data', () => {
      const testText = '123456789012345';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(getModeForText(testText)).toBe(MODE.NUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });
  });

  describe('decodeData - Alphanumeric mode', () => {
    it('should decode alphanumeric data (short, low version)', () => {
      const testText = 'HELLO';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(qr.version).toBeLessThanOrEqual(9);
      expect(getModeForText(testText)).toBe(MODE.ALPHANUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode alphanumeric with URL-like format', () => {
      const testText = 'HTTPS://EXAMPLE.COM';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.M);
      expect(getModeForText(testText)).toBe(MODE.ALPHANUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode alphanumeric with special characters', () => {
      const testText = 'ABC123$%*+-./:';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.Q);
      expect(getModeForText(testText)).toBe(MODE.ALPHANUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode longer alphanumeric data (medium version)', () => {
      const testText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.M);
      expect(getModeForText(testText)).toBe(MODE.ALPHANUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode odd-length alphanumeric strings', () => {
      const testText = 'ABC';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(getModeForText(testText)).toBe(MODE.ALPHANUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });
  });

  describe('decodeData - Byte mode (low version)', () => {
    it('should decode simple byte data', () => {
      const testText = 'Hi';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(qr.version).toBeLessThanOrEqual(9);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode mixed case text (byte mode)', () => {
      const testText = 'Hello World';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(getModeForText(testText)).toBe(MODE.BYTE);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });
  });

  describe('decodeData - High version QR codes', () => {
    it('should decode high version numeric data (version >= 10)', () => {
      const testText = '1'.repeat(800);
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.M);
      expect(qr.version).toBeGreaterThanOrEqual(10);
      expect(getModeForText(testText)).toBe(MODE.NUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode high version alphanumeric data (version >= 10)', () => {
      const testText = 'ABCDEFGHIJ'.repeat(60);
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.M);
      expect(qr.version).toBeGreaterThanOrEqual(10);
      expect(getModeForText(testText)).toBe(MODE.ALPHANUMERIC);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode high version byte data (version >= 10)', () => {
      const testText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(15);
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.M);
      expect(qr.version).toBeGreaterThanOrEqual(10);
      expect(getModeForText(testText)).toBe(MODE.BYTE);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode high version byte data with high EC level', () => {
      const testText = 'x'.repeat(200);
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.H);
      expect(qr.version).toBeGreaterThanOrEqual(5);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should decode version 10+ byte data with correct char count bits', () => {
      const base = 'Test';
      const testText = base.repeat(100);
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(qr.version).toBeGreaterThanOrEqual(10);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
      expect(decoded.length).toBe(testText.length);
    });
  });

  describe('decodeData - version boundary tests', () => {
    it('should correctly handle version 9 (char count bits change boundary)', () => {
      let testText = 'A';
      let qr;
      do {
        testText += 'BCDEFGHIJ';
        qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      } while (qr.version < 9);
      while (qr.version === 9) {
        testText += 'X';
        qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      }
      testText = testText.slice(0, -1);
      qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      expect(qr.version).toBe(9);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });

    it('should correctly handle version 10 (first version with 16-bit byte char count)', () => {
      let testText = 'A';
      let qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      while (qr.version < 10) {
        testText += 'BCDEFGHIJKLMNOPQRSTUVWXYZ';
        qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);
      }
      expect(qr.version).toBeGreaterThanOrEqual(10);
      const decoded = decodeQRFromGenerated(qr);
      expect(decoded).toBe(testText);
    });
  });

  describe('rsDecode', () => {
    it('should return data unchanged when no errors', () => {
      const data = [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80];
      const ecLen = 2;
      const result = rsDecode([...data], ecLen);
      expect(result).toEqual(data.slice(0, data.length - ecLen));
    });

    it('should correct single error', () => {
      const testText = 'AB';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.H);

      const formatInfo = readFormatInfo(qr.matrix);
      const unmasked = unmaskGrid(qr.matrix, formatInfo.maskIndex, qr.version);
      const codewords = readDataCodewords(unmasked, qr.version);
      const dataBytes = extractDataBlocks(codewords, qr.version, formatInfo.ecLevel);

      expect(dataBytes).not.toBeNull();
      const decoded = decodeData(dataBytes, qr.version);
      expect(decoded).toBe(testText);
    });
  });

  describe('readFormatInfo', () => {
    it('should read format info from generated QR code', () => {
      const qr = generateQRCode('test', ERROR_CORRECTION_LEVELS.M);
      const info = readFormatInfo(qr.matrix);

      expect(info).not.toBeNull();
      expect(info.ecLevel).toBe(ERROR_CORRECTION_LEVELS.M);
      expect(info.maskIndex).toBeGreaterThanOrEqual(0);
      expect(info.maskIndex).toBeLessThan(8);
    });

    it('should read format info for different EC levels', () => {
      for (const ec of Object.values(ERROR_CORRECTION_LEVELS)) {
        const qr = generateQRCode('test', ec);
        const info = readFormatInfo(qr.matrix);
        expect(info).not.toBeNull();
        expect(info.ecLevel).toBe(ec);
      }
    });
  });

  describe('unmaskGrid', () => {
    it('should correctly unmask QR code', () => {
      const qr = generateQRCode('test', ERROR_CORRECTION_LEVELS.L);
      const formatInfo = readFormatInfo(qr.matrix);
      expect(formatInfo).not.toBeNull();

      const unmasked = unmaskGrid(qr.matrix, formatInfo.maskIndex, qr.version);

      expect(unmasked.length).toBe(qr.matrix.length);
      expect(unmasked[0].length).toBe(qr.matrix[0].length);
    });

    it('should unmask correctly for all mask patterns', () => {
      for (let maskIdx = 0; maskIdx < 8; maskIdx++) {
        const qr = generateQRCode('test' + maskIdx, ERROR_CORRECTION_LEVELS.L);
        const formatInfo = readFormatInfo(qr.matrix);
        expect(formatInfo).not.toBeNull();
        const unmasked = unmaskGrid(qr.matrix, formatInfo.maskIndex, qr.version);
        expect(unmasked.length).toBe(qr.matrix.length);
      }
    });
  });
});
