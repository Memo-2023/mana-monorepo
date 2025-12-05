import { getCollection } from "astro:content";
import type { APIRoute } from "astro";

// Option 2: Generate static paths for all software
export async function getStaticPaths() {
  const allSoftware = await getCollection("software");
  const uniqueSoftwareIds = new Set();
  
  // Extract unique software IDs
  allSoftware.forEach(entry => {
    const [locale, id] = entry.id.split('/');
    uniqueSoftwareIds.add(id);
  });
  
  // Create a path for each unique software ID
  return Array.from(uniqueSoftwareIds).map(id => ({
    params: { id }
  }));
}

export const GET: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) {
    return new Response(
      JSON.stringify({
        error: "Missing id parameter",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Get all software content
  const allSoftware = await getCollection("software");
  
  // Find the requested software in any language
  const matchingSoftware = allSoftware.filter(entry => {
    const [locale, softwareId] = entry.id.split('/');
    return softwareId === id;
  });

  if (matchingSoftware.length === 0) {
    return new Response(
      JSON.stringify({
        error: "Software not found",
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Get the URL to determine the preferred locale
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") || "en";
  
  // Find the exact match for the language, or fallback to the first matching item
  const localizedSoftware = matchingSoftware.find(entry => entry.id.startsWith(`${lang}/`)) || matchingSoftware[0];
  
  // Extract the locale and id from the entry
  const [locale, softwareId] = localizedSoftware.id.split('/');

  // Mock metrics data (in a real implementation, these would come from Supabase)
  const metrics = {
    easeOfUse: { average: 4.2, count: 15 },
    featureRichness: { average: 3.8, count: 12 },
    valueForMoney: { average: 4.5, count: 18 },
    support: { average: 3.5, count: 10 },
    reliability: { average: 4.0, count: 14 }
  };

  // Format the response with the software data and additional info
  const responseData = {
    id: softwareId,
    locale,
    ...localizedSoftware.data,
    metrics
  };

  return new Response(
    JSON.stringify(responseData),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Add cache control for better performance
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour
      },
    }
  );
};