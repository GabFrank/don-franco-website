/**
 * Google Places API (Place Details) - rating and review count at build time.
 * Requires Places API enabled and an API key.
 * @see https://developers.google.com/maps/documentation/places/web-service/details
 */

const PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

export interface PlaceRatingResult {
  rating?: number;
  user_ratings_total?: number;
}

/**
 * Fetch rating and user_ratings_total for a place. Returns empty object if missing key/placeId or on error.
 */
export async function fetchPlaceRating(
  apiKey: string | undefined,
  placeId: string | undefined
): Promise<PlaceRatingResult> {
  const key = apiKey?.trim();
  const id = placeId?.trim();
  if (!key || !id) return {};

  try {
    const params = new URLSearchParams({
      place_id: id,
      fields: "rating,user_ratings_total",
      key,
    });
    const res = await fetch(`${PLACE_DETAILS_URL}?${params.toString()}`);
    if (!res.ok) return {};

    const json = (await res.json()) as {
      status: string;
      result?: { rating?: number; user_ratings_total?: number };
    };
    if (json.status !== "OK" || !json.result) return {};

    return {
      rating: json.result.rating,
      user_ratings_total: json.result.user_ratings_total,
    };
  } catch {
    return {};
  }
}
