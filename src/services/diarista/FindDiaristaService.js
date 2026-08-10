import { DiaristaSearchService } from './DiaristaSearchService.js';

export class FindDiaristaService {
  constructor(searchService = new DiaristaSearchService()) { this.searchService = searchService; }
  execute(id_diarista) { return this.searchService.find(id_diarista); }
}
