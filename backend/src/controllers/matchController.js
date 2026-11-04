import * as svc from '../services/matchService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const recommendations = asyncHandler(async (req, res) => {
  const items = await svc.getRecommendations(req.user, { eventId: req.query.eventId });
  ApiResponse.ok(res, 'Recommendations retrieved', items, { count: items.length, formula: 'score = 0.60 * skillSimilarity + 0.40 * interestSimilarity (Jaccard, 0-100)' });
});
export const recommendationDetail = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, 'Recommendation details retrieved', await svc.getRecommendationDetail(req.user, req.params.id, { eventId: req.query.eventId })));
