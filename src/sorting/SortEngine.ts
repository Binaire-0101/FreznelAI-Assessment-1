import { AIModel, SortOption } from '../types';

/**
 * OOP SortEngine Class
 * Provides multi-key sorting for AI models including Safetensor file count and Alphabetical sorting.
 */
export class SortEngine {
  /**
   * Sort array of AI models using specified SortOption
   */
  public sort(models: AIModel[], option: SortOption): AIModel[] {
    const sorted = [...models];
    const isAsc = option.direction === 'asc';

    return sorted.sort((a, b) => {
      switch (option.field) {
        case 'safetensorCount':
          return isAsc ? a.safetensorCount - b.safetensorCount : b.safetensorCount - a.safetensorCount;

        case 'name': {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          return isAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }

        case 'downloads':
          return isAsc ? a.downloads - b.downloads : b.downloads - a.downloads;

        case 'likes':
          return isAsc ? a.likes - b.likes : b.likes - a.likes;

        case 'safetensorSizeMB':
          return isAsc ? a.safetensorSizeMB - b.safetensorSizeMB : b.safetensorSizeMB - a.safetensorSizeMB;

        default:
          return 0;
      }
    });
  }
}
