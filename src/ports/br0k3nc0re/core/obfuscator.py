"""
Alpha-Numeric Obfuscation Protocol
Encodes text into a numeric array format and decodes it back.
This is used to bypass text-based safety filters by communicating with the
LLM using a non-standard, numeric representation of language.
"""

CHAR_MAP = {
    'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '5', 'f': '6', 
    'g': '7', 'h': '8', 'i': '9', 'j': '10', 'k': '11', 'l': '12', 
    'm': '13', 'n': '14', 'o': '15', 'p': '16', 'q': '17', 'r': '18', 
    's': '19', 't': '20', 'u': '21', 'v': '22', 'w': '23', 'x': '24', 
    'y': '25', 'z': '26',
    ' ': '0', '.': '27', ',': '28', '!': '29', '?': '30', '\n': '31',
    ':': '32', '-': '33', '(': '34', ')': '35', '[': '36', ']': '37',
    '*': '38', '_': '39', '"': '40', "'": '41', '/': '42', '\\': '43',
    '0': '44', '1': '45', '2': '46', '3': '47', '4': '48', '5': '49',
    '6': '50', '7': '51', '8': '52', '9': '53',
}

REVERSE_CHAR_MAP = {v: k for k, v in CHAR_MAP.items()}

def encode(text: str) -> str:
    """Encodes a string into its space-delimited numeric representation."""
    encoded_list = [CHAR_MAP.get(char.lower(), '') for char in text]
    return " ".join(filter(None, encoded_list))

def decode(encoded_text: str) -> str:
    """Decodes a space-delimited numeric string back to its original text."""
    if not encoded_text or not isinstance(encoded_text, str):
        return ""
        
    tokens = encoded_text.strip().split()
    if not tokens:
        return ""
        
    decoded_chars = [REVERSE_CHAR_MAP.get(token, '') for token in tokens]
    return "".join(decoded_chars)

if __name__ == '__main__':
    original = "Hello, World! This is a test.\nNew line."
    print(f"Original: {original}")
    
    encoded = encode(original)
    print(f"Encoded: {encoded}")
    
    decoded = decode(encoded)
    print(f"Decoded: {decoded}")
    
    print(f"Success: {original.lower() == decoded}")