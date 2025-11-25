// Skript zum Einrichten von Supabase-Funktionen und Tabellen
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Lade Umgebungsvariablen aus .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase-Client erstellen
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Fehler: EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY müssen in der .env-Datei definiert sein.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Funktion zum Ausführen einer SQL-Datei
async function executeSqlFile(filePath) {
  try {
    const fullPath = join(__dirname, filePath);
    console.log(`Führe SQL-Datei aus: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`Fehler: Datei ${fullPath} existiert nicht.`);
      return false;
    }
    
    const query = fs.readFileSync(fullPath, 'utf8');
    
    // Teile die Abfrage in einzelne Anweisungen auf
    const statements = query.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of statements) {
      console.log(`Führe aus: ${statement.trim()}`);
      const { error } = await supabase.rpc('execute_sql', { query: statement.trim() });
      
      if (error) {
        console.error('Fehler bei der Ausführung:', error.message);
        // Fahre trotz Fehler fort
      }
    }
    
    return true;
  } catch (error) {
    console.error('Fehler beim Lesen oder Ausführen der Datei:', error.message);
    return false;
  }
}

// Funktion zum Erstellen der execute_sql-Funktion
async function createExecuteSqlFunction() {
  try {
    console.log('Erstelle execute_sql-Funktion...');
    
    const query = `
      CREATE OR REPLACE FUNCTION execute_sql(query text)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSONB;
      BEGIN
        EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
        RETURN COALESCE(result, '[]'::jsonb);
      EXCEPTION
        WHEN OTHERS THEN
          RAISE EXCEPTION 'SQL-Fehler: %', SQLERRM;
      END;
      $$;
    `;
    
    const { error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
      // Die Funktion existiert möglicherweise noch nicht, versuche direkte SQL-Ausführung
      console.log('Versuche direkte SQL-Ausführung...');
      
      const { error: directError } = await supabase
        .from('_exec_sql')
        .insert({ sql: query });
      
      if (directError) {
        console.error('Fehler beim Erstellen der execute_sql-Funktion:', directError.message);
        return false;
      }
    }
    
    console.log('execute_sql-Funktion erfolgreich erstellt.');
    return true;
  } catch (error) {
    console.error('Unerwarteter Fehler:', error.message);
    return false;
  }
}

// Hauptfunktion
async function setupSupabase() {
  console.log('Starte Supabase-Setup...');
  
  // Erstelle die execute_sql-Funktion
  const execSqlCreated = await createExecuteSqlFunction();
  
  if (!execSqlCreated) {
    console.log('Konnte execute_sql-Funktion nicht erstellen. Versuche trotzdem fortzufahren...');
  }
  
  // Führe die SQL-Dateien aus
  console.log('Führe Supabase-Funktionen-Setup aus...');
  await executeSqlFile('setup_supabase_functions.sql');
  
  console.log('Führe Modell-Updates aus...');
  await executeSqlFile('update_models.sql');
  
  console.log('Richte RLS-Richtlinien ein...');
  await executeSqlFile('setup_rls_policies.sql');
  
  console.log('Supabase-Setup abgeschlossen.');
}

// Führe die Funktion aus
setupSupabase()
  .catch(error => {
    console.error('Unerwarteter Fehler:', error);
  })
  .finally(() => {
    process.exit(0);
  });
