#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';
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

// Readline-Interface für interaktive Eingabe
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funktion zum Ausführen einer SQL-Abfrage
async function executeQuery(query) {
  try {
    console.log(`Führe Abfrage aus: ${query}`);
    const { data, error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
      console.error('Fehler bei der Ausführung der Abfrage:', error.message);
      return;
    }
    
    console.log('Ergebnis:');
    console.table(data);
  } catch (error) {
    console.error('Unerwarteter Fehler:', error.message);
  }
}

// Funktion zum Ausführen einer SQL-Datei
async function executeFile(filePath) {
  try {
    const fullPath = join(process.cwd(), filePath);
    console.log(`Führe SQL-Datei aus: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`Fehler: Datei ${fullPath} existiert nicht.`);
      return;
    }
    
    const query = fs.readFileSync(fullPath, 'utf8');
    await executeQuery(query);
  } catch (error) {
    console.error('Fehler beim Lesen oder Ausführen der Datei:', error.message);
  }
}

// Funktion zum Anzeigen der Tabellenliste
async function listTables() {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
      console.error('Fehler beim Abrufen der Tabellenliste:', error.message);
      return;
    }
    
    console.log('Verfügbare Tabellen:');
    data.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
  } catch (error) {
    console.error('Unerwarteter Fehler:', error.message);
  }
}

// Funktion zum Anzeigen der Tabellenstruktur
async function describeTable(tableName) {
  try {
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
    
    const { data, error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
      console.error(`Fehler beim Beschreiben der Tabelle ${tableName}:`, error.message);
      return;
    }
    
    console.log(`Struktur der Tabelle ${tableName}:`);
    console.table(data);
  } catch (error) {
    console.error('Unerwarteter Fehler:', error.message);
  }
}

// Hauptmenü
function showMenu() {
  console.log('\n--- Supabase CLI ---');
  console.log('1. SQL-Abfrage ausführen');
  console.log('2. SQL-Datei ausführen');
  console.log('3. Tabellenliste anzeigen');
  console.log('4. Tabellenstruktur anzeigen');
  console.log('5. Beenden');
  
  rl.question('\nWähle eine Option (1-5): ', async (answer) => {
    switch (answer.trim()) {
      case '1':
        rl.question('Gib deine SQL-Abfrage ein: ', async (query) => {
          await executeQuery(query);
          showMenu();
        });
        break;
      case '2':
        rl.question('Gib den Pfad zur SQL-Datei ein: ', async (filePath) => {
          await executeFile(filePath);
          showMenu();
        });
        break;
      case '3':
        await listTables();
        showMenu();
        break;
      case '4':
        rl.question('Gib den Tabellennamen ein: ', async (tableName) => {
          await describeTable(tableName);
          showMenu();
        });
        break;
      case '5':
        console.log('Auf Wiedersehen!');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Ungültige Option. Bitte wähle 1-5.');
        showMenu();
        break;
    }
  });
}

// Starte das Programm
console.log('Verbindung zu Supabase hergestellt.');
console.log(`URL: ${supabaseUrl}`);
showMenu();
