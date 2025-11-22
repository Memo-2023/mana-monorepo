#!/usr/bin/env python3
import json
import os

# Define the translations for share and copy
translations = {
    "es": {"share": "Compartir", "copy": "Copiar"},
    "pt": {"share": "Compartilhar", "copy": "Copiar"},
    "nl": {"share": "Delen", "copy": "Kopiëren"},
    "pl": {"share": "Udostępnij", "copy": "Kopiuj"},
    "ru": {"share": "Поделиться", "copy": "Копировать"},
    "ja": {"share": "共有", "copy": "コピー"},
    "zh": {"share": "分享", "copy": "复制"},
    "ar": {"share": "مشاركة", "copy": "نسخ"},
    "tr": {"share": "Paylaş", "copy": "Kopyala"},
    "ko": {"share": "공유", "copy": "복사"},
    "sv": {"share": "Dela", "copy": "Kopiera"},
    "nb": {"share": "Del", "copy": "Kopier"},
    "da": {"share": "Del", "copy": "Kopier"},
    "fi": {"share": "Jaa", "copy": "Kopioi"},
    "el": {"share": "Κοινοποίηση", "copy": "Αντιγραφή"},
    "he": {"share": "שתף", "copy": "העתק"},
    "hi": {"share": "साझा करें", "copy": "कॉपी करें"},
    "hu": {"share": "Megosztás", "copy": "Másolás"},
    "cs": {"share": "Sdílet", "copy": "Kopírovat"},
    "ro": {"share": "Partajează", "copy": "Copiază"},
    "bg": {"share": "Сподели", "copy": "Копирай"},
    "hr": {"share": "Podijeli", "copy": "Kopiraj"},
    "sk": {"share": "Zdieľať", "copy": "Kopírovať"},
    "sl": {"share": "Deli", "copy": "Kopiraj"},
    "sr": {"share": "Подели", "copy": "Копирај"},
    "uk": {"share": "Поділитися", "copy": "Копіювати"},
    "vi": {"share": "Chia sẻ", "copy": "Sao chép"},
    "id": {"share": "Bagikan", "copy": "Salin"},
    "ms": {"share": "Kongsi", "copy": "Salin"},
    "th": {"share": "แชร์", "copy": "คัดลอก"},
}

# Get all the memo_menu translations from English
english_memo_menu = {
    "create": "Create",
    "edit": "Edit",
    "transcript": "Transcript",
    "ask_question": "Ask Question",
    "create_memory": "Create Memory",
    "add_photo": "Add Photo",
    "translate": "Translate",
    "share": "Share",
    "copy": "Copy",
    "pin": "Pin",
    "unpin": "Unpin",
    "search": "Search",
    "replace_word": "Replace Word",
    "label_speakers": "Label Speakers",
    "copy_transcript": "Copy Transcript",
    "delete": "Delete",
    "cancel": "Cancel",
    "delete_memo": "Delete Memo",
    "delete_confirmation": "Do you really want to delete this memo? This action cannot be undone.",
    "memo_actions": "Memo Actions"
}

# Path to translations directory
translations_dir = "/Users/tillschneider/Documents/__00__Code/memoro/features/i18n/translations"

# Process each file
for lang_code, trans in translations.items():
    file_path = os.path.join(translations_dir, f"{lang_code}.json")
    
    if os.path.exists(file_path):
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if memo_menu exists
        if "memo_menu" not in data:
            # Find where to insert it (after header_menu if exists, otherwise after language)
            keys = list(data.keys())
            insert_after = None
            
            if "header_menu" in keys:
                insert_after = "header_menu"
            elif "language" in keys:
                insert_after = "language"
            elif "blueprints" in keys:
                insert_after = "blueprints"
            elif "menu" in keys:
                insert_after = "menu"
            
            # Create new ordered dict with memo_menu inserted
            new_data = {}
            for key, value in data.items():
                new_data[key] = value
                if key == insert_after:
                    # Add memo_menu with placeholder translations
                    # We'll only add share and copy with the provided translations
                    new_data["memo_menu"] = {
                        "translate": "Translate",  # Keep in English as placeholder
                        "share": trans["share"],
                        "copy": trans["copy"]
                    }
            
            # If we didn't find a place to insert, add at the end
            if "memo_menu" not in new_data:
                new_data["memo_menu"] = {
                    "translate": "Translate",  # Keep in English as placeholder
                    "share": trans["share"],
                    "copy": trans["copy"]
                }
            
            data = new_data
        else:
            # memo_menu exists, just update share and copy
            if "translate" in data["memo_menu"]:
                # Insert after translate
                memo_menu = {}
                for key, value in data["memo_menu"].items():
                    memo_menu[key] = value
                    if key == "translate":
                        memo_menu["share"] = trans["share"]
                        memo_menu["copy"] = trans["copy"]
                data["memo_menu"] = memo_menu
            else:
                # Just add them
                data["memo_menu"]["share"] = trans["share"]
                data["memo_menu"]["copy"] = trans["copy"]
        
        # Write back the file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Updated {lang_code}.json")

print("Done!")