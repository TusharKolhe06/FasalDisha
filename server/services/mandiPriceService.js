
import axios from "axios";

export const getMandiPrice = async (crop, district) => {
  const MANDI_API_URL = process.env.MANDI_API_URL;
  const MANDI_API_KEY = process.env.MANDI_API_KEY;

  if (!MANDI_API_URL || !MANDI_API_KEY) {
    throw new Error(
      "Government mandi API is not configured. Add MANDI_API_URL and MANDI_API_KEY."
    );
  }

  try {
    console.log("=================================");
    console.log("FETCHING MANDI DATA");
    console.log("Crop:", crop);
    console.log("District:", district);
    console.log("=================================");

    /*
     * Request data directly for the selected crop and district.
     */
    const response = await axios.get(MANDI_API_URL, {
      params: {
        "api-key": MANDI_API_KEY,
        format: "json",
        limit: 100,

        "filters[state]": "Maharashtra",
        "filters[district]": district,
        "filters[commodity]": crop
      },

      timeout: 15000
    });

    const records = response.data?.records || [];

    console.log("=================================");
    console.log("MANDI API STATUS:", response.status);
    console.log("MANDI RECORD COUNT:", records.length);

    if (records.length > 0) {
      console.log(
        "MANDI FIRST RECORD:",
        JSON.stringify(records[0], null, 2)
      );
    }

    console.log("=================================");

    /*
     * Convert government records into application format.
     */
    const prices = records
      .map((item) => ({
        market: item.market || "Unknown",

        minPrice: Number(item.min_price || 0),

        maxPrice: Number(item.max_price || 0),

        modalPrice: Number(item.modal_price || 0),

        date: item.arrival_date || null
      }))
      .filter((item) => item.modalPrice > 0);

    /*
     * Calculate average modal price.
     */
    const benchmark =
      prices.length > 0
        ? prices.reduce(
            (sum, item) => sum + item.modalPrice,
            0
          ) / prices.length
        : 0;

    console.log("VALID PRICE RECORDS:", prices.length);
    console.log("BENCHMARK PRICE:", benchmark);

    return {
      crop,
      district,
      state: "Maharashtra",

      benchmarkPricePerQuintal:
        Math.round(benchmark * 100) / 100,

      markets: prices,

      source:
        "Government of India OGD / AGMARKNET",

      fetchedAt: new Date()
    };
  } catch (error) {
    console.error("=================================");
    console.error("MANDI API FAILED");
    console.error("STATUS:", error.response?.status);
    console.error(
      "ERROR:",
      error.response?.data || error.message
    );
    console.error("=================================");

    throw new Error(
      "Unable to fetch government mandi prices."
    );
  }
};

