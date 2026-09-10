/**
 * ModelSortService Class for ordering model collections client-side.
 * Binaire Freznel AI Assessment - Requirements #11, #13
 *
 * Supports sorting by:
 * - model name (A-Z)
 * - model name (Z-A)
 * - parameter size (low to high)
 * - parameter size (high to low)
 * - safetensor file count (low to high)
 * - safetensor file count (high to low)
 * - family
 */

import { Model } from '../models/Model';
import { SortOption } from '../types/model';

export class ModelSortService {
  /**
   * Sorts a list of models according to the designated criteria.
   * Pure method that returns a new sorted array.
   */
  public sort(models: Model[], option: SortOption): Model[] {
    const list = [...models];

    switch (option) {
      case SortOption.NAME_ASC:
        return list.sort((a, b) =>
          a.getDisplayName().localeCompare(b.getDisplayName(), undefined, { sensitivity: 'base' })
        );

      case SortOption.NAME_DESC:
        return list.sort((a, b) =>
          b.getDisplayName().localeCompare(a.getDisplayName(), undefined, { sensitivity: 'base' })
        );

      case SortOption.PARAMETERS_ASC:
        return list.sort((a, b) => {
          if (a.weightInBillions !== b.weightInBillions) {
            return a.weightInBillions - b.weightInBillions;
          }
          return a.name.localeCompare(b.name);
        });

      case SortOption.PARAMETERS_DESC:
        return list.sort((a, b) => {
          if (a.weightInBillions !== b.weightInBillions) {
            return b.weightInBillions - a.weightInBillions;
          }
          return a.name.localeCompare(b.name);
        });

      case SortOption.SAFETENSOR_ASC:
        return list.sort((a, b) => {
          if (a.safetensorFileCount !== b.safetensorFileCount) {
            return a.safetensorFileCount - b.safetensorFileCount;
          }
          return a.name.localeCompare(b.name);
        });

      case SortOption.SAFETENSOR_DESC:
        return list.sort((a, b) => {
          if (a.safetensorFileCount !== b.safetensorFileCount) {
            return b.safetensorFileCount - a.safetensorFileCount;
          }
          return a.name.localeCompare(b.name);
        });

      case SortOption.FAMILY_ASC:
        return list.sort((a, b) => {
          const famComp = a.family.localeCompare(b.family, undefined, { sensitivity: 'base' });
          if (famComp !== 0) return famComp;
          return a.name.localeCompare(b.name);
        });

      case SortOption.DOWNLOADS_DESC:
        return list.sort((a, b) => b.downloads - a.downloads);

      default:
        return list;
    }
  }

  /**
   * User-friendly display label for sort dropdown.
   */
  public static getSortLabel(option: SortOption): string {
    switch (option) {
      case SortOption.NAME_ASC:
        return 'Name (A-Z)';
      case SortOption.NAME_DESC:
        return 'Name (Z-A)';
      case SortOption.PARAMETERS_ASC:
        return 'Parameter size (low to high)';
      case SortOption.PARAMETERS_DESC:
        return 'Parameter size (high to low)';
      case SortOption.SAFETENSOR_ASC:
        return 'Safetensors (low to high)';
      case SortOption.SAFETENSOR_DESC:
        return 'Safetensors (high to low)';
      case SortOption.FAMILY_ASC:
        return 'Family';
      case SortOption.DOWNLOADS_DESC:
        return 'Popularity (Downloads)';
      default:
        return 'Default Order';
    }
  }
}
