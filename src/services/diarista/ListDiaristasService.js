import { DiaristaSearchService } from './DiaristaSearchService.js';

export class ListDiaristasService {
  constructor(searchService = new DiaristaSearchService()) { this.searchService = searchService; }
  execute(query) { return this.searchService.list(query); }
}
