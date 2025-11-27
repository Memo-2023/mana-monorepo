#!/usr/bin/env python3
"""
Synchronize quotes between German and English files.
Adds missing translations to both files to ensure consistency.
"""
import json
import time

def load_quotes(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start_idx = content.find('= [') + 3
    end_idx = content.rfind('];')
    array_content = '[' + content[start_idx:end_idx].strip() + ']'

    return json.loads(array_content)

def save_quotes(filepath, quotes, lang):
    var_name = 'quotesDE' if lang == 'de' else 'quotesEN'
    content = """import { EnhancedQuote } from '../../contentLoader';

export const """ + var_name + """: Omit<EnhancedQuote, 'author'>[] = """ + json.dumps(quotes, indent=2, ensure_ascii=False) + ";\n"

    # Backup
    backup = f"{filepath}.backup-{int(time.time() * 1000)}"
    with open(filepath, 'r', encoding='utf-8') as f:
        with open(backup, 'w', encoding='utf-8') as b:
            b.write(f.read())

    # Write
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return backup

# Common translation mappings (simplified - you can extend this)
simple_translations_de_to_en = {
    # Common words/phrases that appear in quotes
    "Wissen": "Knowledge",
    "Leben": "Life",
    "Liebe": "Love",
    "Erfolg": "Success",
    "Glück": "Happiness",
}

simple_translations_en_to_de = {
    "Knowledge": "Wissen",
    "Life": "Leben",
    "Love": "Liebe",
    "Success": "Erfolg",
    "Happiness": "Glück",
}

print("🚀 Synchronizing translations...\n")

# Load quotes
de_path = '/Users/tillschneider/Documents/__00__Code/quote/services/data/quotes/de.ts'
en_path = '/Users/tillschneider/Documents/__00__Code/quote/services/data/quotes/en.ts'

de_quotes = load_quotes(de_path)
en_quotes = load_quotes(en_path)

print(f"📊 Loaded {len(de_quotes)} German quotes")
print(f"📊 Loaded {len(en_quotes)} English quotes")

# Create dictionaries
de_dict = {q['id']: q for q in de_quotes}
en_dict = {q['id']: q for q in en_quotes}

# Find missing
missing_in_en_ids = set(de_dict.keys()) - set(en_dict.keys())
missing_in_de_ids = set(en_dict.keys()) - set(de_dict.keys())

print(f"\n🔍 Missing in English: {len(missing_in_en_ids)}")
print(f"🔍 Missing in German: {len(missing_in_de_ids)}")

# For this automated approach, we'll add the quotes with a note that they need translation
# Users can then review and improve translations later

print("\n⚠️  Adding quotes with [DE] and [EN] markers for manual review...")

# Add missing English translations (copy German text with marker)
for qid in missing_in_en_ids:
    de_quote = de_dict[qid].copy()
    de_quote['text'] = f"[DE: {de_quote['text']}]"  # Mark as needing translation
    de_quote['language'] = 'en'
    en_quotes.append(de_quote)

# Add missing German translations (copy English text with marker)
for qid in missing_in_de_ids:
    en_quote = en_dict[qid].copy()
    en_quote['text'] = f"[EN: {en_quote['text']}]"  # Mark as needing translation
    en_quote['language'] = 'de'
    de_quotes.append(en_quote)

# Sort by ID
de_quotes.sort(key=lambda x: x['id'])
en_quotes.sort(key=lambda x: x['id'])

print(f"\n📊 New totals:")
print(f"   German: {len(de_quotes)}")
print(f"   English: {len(en_quotes)}")

# Save
print("\n💾 Saving files...")
de_backup = save_quotes(de_path, de_quotes, 'de')
en_backup = save_quotes(en_path, en_quotes, 'en')

print(f"   German backup: {de_backup}")
print(f"   English backup: {en_backup}")

print("\n✅ Synchronization complete!")
print("\n⚠️  NOTE: Quotes marked with [DE:...] or [EN:...] need manual translation.")
print("   You can search for these markers and replace with proper translations.")
