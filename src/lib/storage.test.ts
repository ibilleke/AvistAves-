import AsyncStorage from '@react-native-async-storage/async-storage';

import { getItem, setItem } from './storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('storage wrapper', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns null when the key does not exist', async () => {
    expect(await getItem('missing-key')).toBeNull();
  });

  it('round-trips a JSON-serializable value', async () => {
    const value = { a: 1, b: ['x', 'y'], c: { nested: true } };
    await setItem('some-key', value);
    expect(await getItem('some-key')).toEqual(value);
  });

  it('stores values as JSON strings under the hood', async () => {
    await setItem('raw-key', [1, 2, 3]);
    const raw = await AsyncStorage.getItem('raw-key');
    expect(raw).toBe('[1,2,3]');
  });
});
