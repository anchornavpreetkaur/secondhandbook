from datetime import datetime, timezone
from typing import Optional, Dict, Any
from cleaners import (
    clean_text,
    clean_price,
    normalize_currency,
    normalize_condition,
    normalize_availability,
    normalize_isbn,
)

class BookListing:
    """
    Common Book Data Model for second-hand book price comparison.
    Normalizes diverse website schemas into a unified, clean representation.
    """
    def __init__(
        self,
        title: str,
        price: Any,
        source_url: str,
        website: str,
        author: Optional[str] = "Unknown Author",
        isbn: Optional[str] = None,
        edition: Optional[str] = None,
        condition: Optional[str] = "Good",
        currency: Optional[str] = "INR",
        availability: Optional[str] = "In Stock",
        cover_image: Optional[str] = None,
        scraped_at: Optional[datetime] = None,
    ):
        self.title = clean_text(title)
        self.author = clean_text(author) if author else "Unknown Author"
        self.isbn = normalize_isbn(isbn)
        self.edition = clean_text(edition) if edition else None
        self.condition = normalize_condition(condition)
        self.price = clean_price(price)
        self.currency = normalize_currency(currency)
        self.availability = normalize_availability(availability)
        self.sourceUrl = clean_text(source_url)
        self.website = clean_text(website)
        self.coverImage = clean_text(cover_image) if cover_image else None
        self.scrapedAt = scraped_at or datetime.now(timezone.utc)

    def is_valid(self) -> bool:
        """
        Validates minimum required fields:
        title, valid numeric price > 0, sourceUrl, and website.
        """
        if not self.title or len(self.title) < 2:
            return False
        if self.price is None or self.price <= 0:
            return False
        if not self.sourceUrl or not self.website:
            return False
        return True

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the normalized book model to dictionary for MongoDB storage.
        """
        return {
            "title": self.title,
            "author": self.author,
            "isbn": self.isbn,
            "edition": self.edition,
            "condition": self.condition,
            "price": self.price,
            "currency": self.currency,
            "availability": self.availability,
            "sourceUrl": self.sourceUrl,
            "website": self.website,
            "coverImage": self.coverImage,
            "scrapedAt": self.scrapedAt.isoformat() if isinstance(self.scrapedAt, datetime) else self.scrapedAt,
        }

    def __repr__(self) -> str:
        return f"<BookListing '{self.title}' | {self.website} | {self.currency} {self.price}>"
