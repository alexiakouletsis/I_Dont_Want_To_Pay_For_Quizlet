#!/usr/bin/env python3
"""
Script to clean up vocab_list.txt and convert it to a Python dictionary.
Removes whitespace and filters for valid Italian-English translation pairs.
"""

def clean_vocab_list(input_file):
    """
    Read vocab file, clean whitespace, and create dictionary of Italian-English pairs.
    
    Args:
        input_file (str): Path to the vocabulary file
        
    Returns:
        dict: Dictionary with Italian words/phrases as keys and English translations as values
    """
    vocab_dict = {}
    
    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        # Clean whitespace from all lines and filter out empty lines
        cleaned_lines = []
        for line in lines:
            cleaned_line = line.strip()
            if cleaned_line:  # Only keep non-empty lines
                cleaned_lines.append(cleaned_line)
        
        # Process pairs (Italian on even indices, English on odd indices)
        for i in range(0, len(cleaned_lines) - 1, 2):
            italian = cleaned_lines[i]
            english = cleaned_lines[i + 1] if i + 1 < len(cleaned_lines) else None
            
            # Only add if both Italian and English exist and seem valid
            if italian and english and is_valid_pair(italian, english):
                vocab_dict[italian] = english
        
        return vocab_dict
        
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
        return {}
    except Exception as e:
        print(f"Error reading file: {e}")
        return {}

def is_valid_pair(italian, english):
    """
    Check if a pair appears to be a valid Italian-English translation.
    
    Args:
        italian (str): Italian word/phrase
        english (str): English word/phrase
        
    Returns:
        bool: True if the pair seems valid
    """
    # Basic validation: both should be non-empty strings
    if not italian or not english:
        return False
    
    # Skip if either is just numbers or special characters
    if italian.isdigit() or english.isdigit():
        return False
    
    # Skip if either is too short (likely incomplete)
    if len(italian.strip()) < 2 or len(english.strip()) < 2:
        return False
    
    return True

def main():
    input_file = '/Users/jackblundin/Quizlet_Replacement/vocab_list.txt'
    
    print("Processing vocabulary list...")
    vocab_dict = clean_vocab_list(input_file)
    
    print(f"\nFound {len(vocab_dict)} valid translation pairs.")
    print("\nSample entries:")
    
    # Show first 10 entries as examples
    for i, (italian, english) in enumerate(vocab_dict.items()):
        if i >= 10:
            break
        print(f"  '{italian}' -> '{english}'")
    
    # Save the dictionary to a Python file
    output_file = '/Users/jackblundin/Quizlet_Replacement/vocab_dict.py'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Italian-English Vocabulary Dictionary\n")
        f.write("# Generated from vocab_list.txt\n\n")
        f.write("vocab_dict = {\n")
        
        for italian, english in vocab_dict.items():
            # Escape quotes in the strings
            italian_escaped = italian.replace("'", "\\'")
            english_escaped = english.replace("'", "\\'")
            f.write(f"    '{italian_escaped}': '{english_escaped}',\n")
        
        f.write("}\n")
    
    print(f"\nDictionary saved to: {output_file}")
    
    # Also print the dictionary for immediate use
    print(f"\nPython dictionary format:")
    print("vocab_dict = {")
    for italian, english in vocab_dict.items():
        italian_escaped = italian.replace("'", "\\'")
        english_escaped = english.replace("'", "\\'")
        print(f"    '{italian_escaped}': '{english_escaped}',")
    print("}")

if __name__ == "__main__":
    main()
