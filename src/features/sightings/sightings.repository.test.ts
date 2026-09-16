import AsyncStorage from '@react-native-async-storage/async-storage';

import { sightingsRepository } from './sightings.repository';
import type { BirdSighting } from './types';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

function baseInput(overrides: Partial<Omit<BirdSighting, 'id' | 'createdAt'>> = {}) {
  return {
    birdName: 'Zorzal',
    count: 1,
    photoUri: 'mock://sin-foto',
    observedAt: new Date('2026-01-01T10:00:00.000Z').toISOString(),
    location: { latitude: -33.45, longitude: -70.66 },
    ...overrides,
  };
}

describe('sightingsRepository', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts empty', async () => {
    expect(await sightingsRepository.getAll()).toEqual([]);
  });

  it('create() assigns an id and createdAt, and persists the record', async () => {
    const created = await sightingsRepository.create(baseInput());

    expect(created.id).toEqual(expect.any(String));
    expect(created.id.length).toBeGreaterThan(0);
    expect(created.createdAt).toEqual(expect.any(String));
    expect(new Date(created.createdAt).toString()).not.toBe('Invalid Date');

    const all = await sightingsRepository.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].birdName).toBe('Zorzal');
  });

  it('getAll() returns records ordered by createdAt, most recent first', async () => {
    const first = await sightingsRepository.create(baseInput({ birdName: 'Primero' }));
    // Aseguramos createdAt distinto aunque el reloj del sistema sea muy rápido.
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await sightingsRepository.create(baseInput({ birdName: 'Segundo' }));

    const all = await sightingsRepository.getAll();
    expect(all.map((s) => s.id)).toEqual([second.id, first.id]);
  });

  it('getById() finds the matching record', async () => {
    const created = await sightingsRepository.create(baseInput({ birdName: 'Chincol' }));
    await sightingsRepository.create(baseInput({ birdName: 'Otro' }));

    const found = await sightingsRepository.getById(created.id);
    expect(found?.birdName).toBe('Chincol');
  });

  it('getById() returns undefined for an unknown id', async () => {
    expect(await sightingsRepository.getById('does-not-exist')).toBeUndefined();
  });

  it('generates distinct ids for successive records', async () => {
    const a = await sightingsRepository.create(baseInput());
    const b = await sightingsRepository.create(baseInput());
    expect(a.id).not.toBe(b.id);
  });
});
