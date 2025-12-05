import { getCollection } from 'astro:content';
// Falls Supabase-Umgebungsvariablen fehlen, wenden wir einen Fallback an
let supabase;
try {
  supabase = await import('../../utils/supabase').then(m => m.supabase);
} catch (error) {
  console.warn('Supabase client could not be initialized, using fallback data');
}

export async function GET() {
  try {
    // Software-Daten aus Content Collections abrufen
    const allSoftware = await getCollection('software');
    
    // Metriken-Map für die Software-Daten
    let metricsMap = {};
    
    // Versuche, Daten von Supabase zu laden, falls verfügbar
    if (supabase) {
      try {
        const { data: metricsData, error } = await supabase
          .from('software_metrics')
          .select('*');
        
        if (error) {
          console.error('Error fetching metrics:', error);
          // Weiter mit leeren Metriken
        } else if (metricsData) {
          // Metrics in ein leicht zugängliches Format konvertieren
          metricsData.forEach(item => {
            if (!metricsMap[item.software_id]) {
              metricsMap[item.software_id] = {};
            }
            metricsMap[item.software_id][item.metric] = {
              average: parseFloat(item.average_rating) || 0,
              count: parseInt(item.vote_count) || 0
            };
          });
        }
      } catch (error) {
        console.error('Supabase query failed:', error);
        // Weiter mit leeren Metriken
      }
    } else {
      // Fallback: Dummy-Metriken für die Demo
      allSoftware.forEach(software => {
        metricsMap[software.id] = {
          'usability': { average: 4.5, count: 25 },
          'features': { average: 4.2, count: 18 },
          'reliability': { average: 4.0, count: 22 }
        };
      });
    }
    
    // Daten für die Suche aufbereiten
    const searchData = allSoftware.map(entry => {
      const [locale, id] = entry.id.split('/');
      return {
        id,
        locale,
        ...entry.data,
        metrics: metricsMap[entry.id] || {},
        url: `/${locale}/software/${id}`
      };
    });
    
    return new Response(JSON.stringify(searchData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error generating software data:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate software data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}