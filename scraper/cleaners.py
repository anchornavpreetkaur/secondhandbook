import re
from typing import Optional, Union

def clean_text(text: Optional[str]) -> str:
    """
    Cleans raw text by stripping leading/trailing whitespace,
    collapsing multiple whitespace/newlines into a single space,
    and removing non-printable control characters.
    """
    if not text:
        return ""
    # Normalize unicode spaces and control characters
    text = re.sub(r'[\r\n\t]+', ' ', str(text))
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def clean_price(price_raw: Union[str, int, float, None]) -> Optional[float]:
    """
    Extracts a numeric float price from raw price strings or numbers.
    Handles values like:
    '₹350' -> 350.0
    'INR 420' -> 420.0
    '£51.77' -> 51.77
    '$ 12.99' -> 12.99
    '1,250.50' -> 1250.50
    """
    if price_raw is None:
        return None
    if isinstance(price_raw, (int, float)):
        return round(float(price_raw), 2)

    cleaned = str(price_raw).strip()
    if not cleaned:
        return None

    # Replace commas in numbers like 1,250.00
    cleaned = cleaned.replace(',', '')

    # Regex search for first floating point or integer match
    match = re.search(r'(\d+(?:\.\d{1,2})?)', cleaned)
    if match:
        try:
            return round(float(match.group(1)), 2)
        except ValueError:
            return None
    return None


def normalize_currency(currency_raw: Optional[str], default: str = "INR") -> str:
    """
    Normalizes currency representations to standard 3-letter ISO code:
    '₹' or 'rs' or 'inr' -> 'INR'
    '$' or 'usd' -> 'USD'
    '£' or 'gbp' -> 'GBP'
    '€' or 'eur' -> 'EUR'
    """
    if not currency_raw:
        return default

    raw = str(currency_raw).strip().upper()

    if '₹' in raw or 'RS' in raw or 'INR' in raw:
        return 'INR'
    if '£' in raw or 'GBP' in raw:
        return 'GBP'
    if '$' in raw or 'USD' in raw:
        return 'USD'
    if '€' in raw or 'EUR' in raw:
        return 'EUR'
    if 'CAD' in raw:
        return 'CAD'
    if 'AUD' in raw:
        return 'AUD'

    # Fallback to alpha characters only if 3 letters
    alpha = re.sub(r'[^A-Z]', '', raw)
    if len(alpha) == 3:
        return alpha

    return default


def normalize_condition(condition_raw: Optional[str]) -> str:
    """
    Normalizes second-hand book condition into standard industry categories:
    'Like New', 'Very Good', 'Good', 'Acceptable', 'Fair', 'New'
    """
    if not condition_raw:
        return "Good"  # Sensible default for second-hand stores

    raw = clean_text(condition_raw).lower()

    if any(k in raw for k in ['as new', 'like new', 'fine', 'mint']):
        return "Like New"
    if any(k in raw for k in ['very good', 'v. good', 'vg+']):
        return "Very Good"
    if any(k in raw for k in ['acceptable', 'readable', 'poor', 'reading copy']):
        return "Acceptable"
    if any(k in raw for k in ['fair', 'worn']):
        return "Fair"
    if 'new' in raw and 'like' not in raw:
        return "New"
    if 'good' in raw:
        return "Good"

    return "Good"


def normalize_availability(avail_raw: Optional[str]) -> str:
    """
    Normalizes availability string into:
    'In Stock', 'Limited Stock', 'Out of Stock', 'Pre-Order'
    """
    if not avail_raw:
        return "In Stock"

    raw = clean_text(avail_raw).lower()

    if any(k in raw for k in ['out of stock', 'sold out', 'unavailable', '0 available']):
        return "Out of Stock"
    if any(k in raw for k in ['limited', 'only', 'left in stock', 'few left']):
        return "Limited Stock"
    if any(k in raw for k in ['in stock', 'available', 'ready to ship']):
        return "In Stock"

    return "In Stock"


def normalize_isbn(isbn_raw: Optional[str]) -> Optional[str]:
    """
    Normalizes an ISBN-10 or ISBN-13 string.
    Removes hyphens, spaces, and non-alphanumeric characters.
    Validates length (10 or 13).
    Returns None if missing or invalid.
    """
    if not isbn_raw:
        return None

    cleaned = re.sub(r'[^0-9X-x]', '', str(isbn_raw)).upper()

    if len(cleaned) in (10, 13):
        return cleaned

    # Sometimes UPC is 12 digits, return as identifier if formatted
    if len(cleaned) == 12:
        return cleaned

    return None
