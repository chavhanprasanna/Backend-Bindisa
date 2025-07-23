import { describe, it, expect } from '@jest/globals';

describe('Basic Tests', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test string operations', () => {
    const str = 'Hello World';
    expect(str.toLowerCase()).toBe('hello world');
  });

  it('should test array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });

  it('should test object operations', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
  });
});
