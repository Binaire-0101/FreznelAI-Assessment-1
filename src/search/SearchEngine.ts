import { AIModel, MatchType, SearchMode } from '../types';

/**
 * OOP SearchEngine Class
 * Provides precise search over AI models using configurable substring matching (start vs middle).
 */
export class SearchEngine {
  /**
   * Search models based on query text, search mode (Name, Family, All), and match position (Start vs Middle).
   */
  public search(
    models: AIModel[],
    query: string,
    mode: SearchMode = 'all',
    matchType: MatchType = 'any'
  ): AIModel[] {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return models;
    }

    return models.filter((model) => this.matchesModel(model, trimmedQuery, mode, matchType));
  }

  private matchesModel(
    model: AIModel,
    query: string,
    mode: SearchMode,
    matchType: MatchType
  ): boolean {
    const targetTexts: string[] = [];

    if (mode === 'name') {
      targetTexts.push(model.name.toLowerCase());
    } else if (mode === 'family') {
      targetTexts.push(model.family.toLowerCase());
    } else {
      targetTexts.push(model.name.toLowerCase());
      targetTexts.push(model.family.toLowerCase());
      targetTexts.push(model.description.toLowerCase());
      targetTexts.push(model.author.toLowerCase());
    }

    return targetTexts.some((text) => this.evaluateSubstringMatch(text, query, matchType));
  }

  /**
   * Evaluates substring match based on matchType:
   * - 'start': String or any word token starts with query substring
   * - 'middle': Query exists strictly in the middle of string (not at 0 index) or inside words
   * - 'any': Query exists anywhere inside the string
   */
  public evaluateSubstringMatch(text: string, query: string, matchType: MatchType): boolean {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    if (matchType === 'start') {
      // Matches if model name or family starts with query OR any slash/hyphen-separated token starts with query
      if (textLower.startsWith(queryLower)) return true;
      const tokens = textLower.split(/[\/\-_\s]+/);
      return tokens.some((token) => token.startsWith(queryLower));
    } else if (matchType === 'middle') {
      const index = textLower.indexOf(queryLower);
      // Matches substring from middle (i.e. present in string but not starting at index 0)
      return index > 0 && index + queryLower.length < textLower.length;
    } else {
      // 'any' substring match
      return textLower.includes(queryLower);
    }
  }
}
