import { normalizeUrl, getHostname } from '../url';

describe('url utilities', () => {
  describe('normalizeUrl', () => {
    it('should add https:// prefix if missing', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('google.com')).toBe('https://google.com');
    });

    it('should not modify URLs that already have http://', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should not modify URLs that already have https://', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    });

    it('should handle URLs with paths', () => {
      expect(normalizeUrl('example.com/path')).toBe('https://example.com/path');
    });
  });

  describe('getHostname', () => {
    it('should extract hostname from valid URL', () => {
      expect(getHostname('https://example.com')).toBe('example.com');
      expect(getHostname('https://www.example.com')).toBe('www.example.com');
      expect(getHostname('http://subdomain.example.com/path')).toBe('subdomain.example.com');
    });

    it('should return original string if URL is invalid', () => {
      expect(getHostname('not-a-url')).toBe('not-a-url');
      expect(getHostname('')).toBe('');
    });

    it('should handle URLs with ports', () => {
      expect(getHostname('https://example.com:8080')).toBe('example.com');
    });
  });
});
