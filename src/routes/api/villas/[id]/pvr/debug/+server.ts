import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { VillaService } from "$lib/server/services/villa.service";
import { onlyAdmin } from "$lib/server/auth-utils";
import { MAX_FACILITY_SCORE } from "$lib/utils/formula";

export const GET: RequestHandler = onlyAdmin(async ({ params }) => {
  const villaId = parseInt(params.id, 10);

  if (isNaN(villaId)) {
    return json({ error: "Invalid villa ID" }, { status: 400 });
  }

  try {
    const villa = await VillaService.findById(villaId);

    if (!villa) {
      return json({ error: "Villa not found" }, { status: 404 });
    }

    const priceMin = parseFloat(villa.priceMin);
    const priceMax = parseFloat(villa.priceMax);

    if (!priceMin || !priceMax || priceMin <= 0 || priceMax <= 0) {
      return json({
        error: "Invalid price data",
        priceMin,
        priceMax,
      });
    }

    // Calculate facility score breakdown using VillaService method
    const facilityInfo = VillaService.calculateFacilityScoreDetails(villa);
    const facilityDetails = facilityInfo.params;
    const facilitySum = facilityInfo.sum;
    const facilityScore = facilityInfo.score;

    // Rating normalization
    const rating = parseFloat(villa.googleRating || "0");
    const ratingCount = villa.googleRatingCount || 0;
    const normalizedRating =
      (50 * 4.5 + ratingCount * rating) / (50 + ratingCount);

    // Price calculation
    const averagePrice = (priceMin + priceMax) / 2;
    const adjustedPrice = averagePrice / 2;

    // PVR calculation
    const priceSensitivity = 1.65;
    const numerator = facilityScore * normalizedRating;
    const denominator = priceSensitivity * Math.log(adjustedPrice);
    const pvrScore = (10 * numerator) / denominator;
    const finalPVR = Math.ceil(pvrScore * 100) / 100;

    const debugInfo = {
      villaId: villaId,
      villaTitle: villa.title,
      facilityScore: {
        details: facilityDetails,
        sum: facilitySum,
        maxScore: MAX_FACILITY_SCORE,
        score: facilityScore,
        formula: `F = Sum of weights / ${MAX_FACILITY_SCORE}`,
      },
      rating: {
        googleRating: rating,
        googleRatingCount: ratingCount,
        normalizedRating: normalizedRating,
        formula: "R = (50 × 4.5 + n × r) / (50 + n)",
        calculation: `R = (50 × 4.5 + ${ratingCount} × ${rating}) / (50 + ${ratingCount}) = ${normalizedRating.toFixed(3)}`,
      },
      price: {
        priceMin,
        priceMax,
        averagePrice,
        adjustedPrice,
        formula: "P = (priceMin + priceMax) / 2, then P_adjusted = P / 2",
        calculation: `P = (${priceMin} + ${priceMax}) / 2 = ${averagePrice}, P_adjusted = ${averagePrice} / 2 = ${adjustedPrice}`,
      },
      pvrCalculation: {
        priceSensitivity,
        numerator,
        denominator,
        pvrScore,
        finalPVR,
        formula: "PVR = 10 × (F × R) / (1.65 × ln(P_adjusted))",
        calculation: `PVR = 10 × (${facilityScore.toFixed(3)} × ${normalizedRating.toFixed(3)}) / (${priceSensitivity} × ln(${adjustedPrice}))`,
        steps: [
          `Numerator = F × R = ${facilityScore.toFixed(3)} × ${normalizedRating.toFixed(3)} = ${numerator.toFixed(3)}`,
          `Denominator = 1.65 × ln(${adjustedPrice}) = 1.65 × ${Math.log(adjustedPrice).toFixed(3)} = ${denominator.toFixed(3)}`,
          `PVR = 10 × ${numerator.toFixed(3)} / ${denominator.toFixed(3)} = ${pvrScore.toFixed(3)}`,
          `Final PVR (rounded up) = ${finalPVR}`,
        ],
      },
      currentPVR: villa.pvr,
    };

    return json(debugInfo);
  } catch (error) {
    console.error(`Error getting debug info for villa ${villaId}:`, error);
    return json({ error: "Failed to get debug information" }, { status: 500 });
  }
});
