import { db } from '../../db/database';
import { ExerciseCatalogItem } from '../../types';
import { generateId } from '../../utils/id';

export const catalogService = {
  /**
   * Returns all catalog exercises, ensuring initial seed exists
   */
  async getAll(): Promise<ExerciseCatalogItem[]> {
    await db.ensureInitialCatalog();
    return db.catalog.toArray();
  },

  /**
   * Search and filter exercises
   */
  async search(query: string, category?: string): Promise<ExerciseCatalogItem[]> {
    await db.ensureInitialCatalog();
    let list = await db.catalog.toArray();

    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      list = list.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
    }

    if (category && category !== 'all') {
      list = list.filter((item) => item.category === category);
    }

    // Sort alphabetically by name
    return list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  },

  /**
   * Adds a new custom exercise created by user
   */
  async addCustom(item: Omit<ExerciseCatalogItem, 'id' | 'isCustom'>): Promise<ExerciseCatalogItem> {
    const newItem: ExerciseCatalogItem = {
      ...item,
      id: 'custom_' + generateId(),
      isCustom: true
    };
    await db.catalog.add(newItem);
    return newItem;
  },

  /**
   * Deletes a custom exercise by id. Non-custom default exercises cannot be deleted.
   */
  async deleteCustom(id: string): Promise<boolean> {
    const item = await db.catalog.get(id);
    if (!item || !item.isCustom) {
      return false;
    }
    await db.catalog.delete(id);
    return true;
  }
};
