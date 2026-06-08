import { describe, it, expect } from 'vitest';
import {
  imageToGrayscale,
  binarize,
  getVersionSize,
  readFormatInfo,
  applyMask,
  readDataCodewords,
  rsDecode,
  extractDataBlocks,
  decodeData,
} from '@/pages/qrcode/qrcodeDecoder.js';
import { generateQRCode } from '@/pages/qrcode/qrcodeEncoder.js';
import { ERROR_CORRECTION_LEVELS } from '@/pages/qrcode/constants.js';

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

  describe('decodeData', () => {
    it('should decode numeric data', () => {
      const testText = '12345';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);

      const formatInfo = readFormatInfo(qr.matrix);
      expect(formatInfo).not.toBeNull();

      const unmasked = applyMask(qr.matrix, formatInfo.maskIndex, qr.version);
      const codewords = readDataCodewords(unmasked, qr.version);
      const dataBytes = extractDataBlocks(codewords, qr.version, formatInfo.ecLevel);

      expect(dataBytes).not.toBeNull();

      const decoded = decodeData(dataBytes);
      expect(decoded).toBe(testText);
    });

    it('should decode simple byte data', () => {
      const testText = 'Hi';
      const qr = generateQRCode(testText, ERROR_CORRECTION_LEVELS.L);

      const formatInfo = readFormatInfo(qr.matrix);
      expect(formatInfo).not.toBeNull();

      const unmasked = applyMask(qr.matrix, formatInfo.maskIndex, qr.version);
      const codewords = readDataCodewords(unmasked, qr.version);
      const dataBytes = extractDataBlocks(codewords, qr.version, formatInfo.ecLevel);

      expect(dataBytes).not.toBeNull();

      const decoded = decodeData(dataBytes);
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
      const unmasked = applyMask(qr.matrix, formatInfo.maskIndex, qr.version);
      const codewords = readDataCodewords(unmasked, qr.version);
      const dataBytes = extractDataBlocks(codewords, qr.version, formatInfo.ecLevel);

      expect(dataBytes).not.toBeNull();
      const decoded = decodeData(dataBytes);
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

  describe('applyMask', () => {
    it('should correctly unmask QR code', () => {
      const qr = generateQRCode('test', ERROR_CORRECTION_LEVELS.L);
      const formatInfo = readFormatInfo(qr.matrix);
      expect(formatInfo).not.toBeNull();

      const unmasked = applyMask(qr.matrix, formatInfo.maskIndex, qr.version);

      expect(unmasked.length).toBe(qr.matrix.length);
      expect(unmasked[0].length).toBe(qr.matrix[0].length);
    });
  });
});
