import { getItem, setItem } from '../../lib/storage';
import type { BirdSighting } from './types';

const STORAGE_KEY = '@avistaves/sightings';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readAll(): Promise<BirdSighting[]> {
  return (await getItem<BirdSighting[]>(STORAGE_KEY)) ?? [];
}

export const sightingsRepository = {
  async getAll(): Promise<BirdSighting[]> {
    const sightings = await readAll();
    return [...sightings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async getById(id: string): Promise<BirdSighting | undefined> {
    const sightings = await readAll();
    return sightings.find((sighting) => sighting.id === id);
  },

  async create(input: Omit<BirdSighting, 'id' | 'createdAt'>): Promise<BirdSighting> {
    const sightings = await readAll();
    const sighting: BirdSighting = {
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await setItem(STORAGE_KEY, [...sightings, sighting]);
    return sighting;
  },
};
