#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path
from datetime import datetime

def deduplicate_quotes(file_path, language):
    print(f"\n📖 Processing {language.upper()} quotes from: {file_path}")

    # Read file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract quotes array using regex
    match = re.search(r'export const quotes[A-Z]{2}: .*?\[\s*([\s\S]*?)\s*\];', content)
    if not match:
        print("❌ Could not find quotes array in file")
        return None

    # Parse JSON array
    quotes_json = '[' + match.group(1) + ']'
    try:
        quotes = json.loads(quotes_json)
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing quotes: {e}")
        return None

    print(f"📊 Total quotes before deduplication: {len(quotes)}")

    # Find duplicates by text
    text_map = {}
    for quote in quotes:
        text = quote['text']
        if text not in text_map:
            text_map[text] = []
        text_map[text].append(quote)

    # Identify duplicates
    duplicates = [(text, quotes_list) for text, quotes_list in text_map.items() if len(quotes_list) > 1]

    print(f"\n🔍 Found {len(duplicates)} duplicate texts")
    removed_count = sum(len(quotes_list) - 1 for _, quotes_list in duplicates)
    print(f"📝 Total duplicate quote entries: {removed_count}")

    # Log examples
    print('\n📋 Examples of duplicates:')
    for i, (text, quotes_list) in enumerate(duplicates[:5], 1):
        short_text = text[:80] + ('...' if len(text) > 80 else '')
        ids = ', '.join(q['id'] for q in quotes_list)
        print(f"\n{i}. Text: \"{short_text}\"")
        print(f"   Found {len(quotes_list)} times with IDs: {ids}")

    # Deduplicate: Keep first occurrence
    unique_quotes = []
    seen_texts = set()

    for quote in quotes:
        if quote['text'] not in seen_texts:
            unique_quotes.append(quote)
            seen_texts.add(quote['text'])

    print(f"\n✅ Quotes after deduplication: {len(unique_quotes)}")
    print(f"🗑️  Removed: {len(quotes) - len(unique_quotes)} duplicate entries")

    # Create backup
    backup_path = f"{file_path}.backup-{int(datetime.now().timestamp() * 1000)}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n💾 Backup created: {backup_path}")

    # Generate new content
    variable_name = 'quotesDE' if language == 'de' else 'quotesEN'
    import_statement = "import { EnhancedQuote } from '../../contentLoader';"

    new_content = f"""{import_statement}

export const {variable_name}: Omit<EnhancedQuote, 'author'>[] = {json.dumps(unique_quotes, indent=2, ensure_ascii=False)};
"""

    # Write deduplicated file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"✨ File updated successfully: {file_path}\n")

    return {
        'before': len(quotes),
        'after': len(unique_quotes),
        'removed': len(quotes) - len(unique_quotes),
        'duplicate_texts': len(duplicates)
    }

def main():
    project_root = Path(__file__).parent.parent

    print('🚀 Starting deduplication process...\n')
    print('=' * 60)

    de_result = deduplicate_quotes(
        project_root / 'services/data/quotes/de.ts',
        'de'
    )

    print('=' * 60)

    en_result = deduplicate_quotes(
        project_root / 'services/data/quotes/en.ts',
        'en'
    )

    print('=' * 60)
    print('\n📊 SUMMARY:')
    print('=' * 60)

    if de_result:
        print(f"\n🇩🇪 German Quotes:")
        print(f"   Before: {de_result['before']}")
        print(f"   After:  {de_result['after']}")
        print(f"   Removed: {de_result['removed']}")

    if en_result:
        print(f"\n🇬🇧 English Quotes:")
        print(f"   Before: {en_result['before']}")
        print(f"   After:  {en_result['after']}")
        print(f"   Removed: {en_result['removed']}")

    print('\n✅ Deduplication complete!\n')

if __name__ == '__main__':
    main()
