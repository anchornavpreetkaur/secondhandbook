import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "second_hand_books")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "books")

# Scraping Settings
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "15"))
DEFAULT_USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Research Prototype; Book Price Comparison)"
)

# Source Endpoints / Configurations
SOURCE_CONFIGS = {
    "BooksToScrape": {
        "name": "Books to Scrape",
        "base_url": "https://books.toscrape.com",
        "category_url": "https://books.toscrape.com/catalogue/page-{page}.html",
        "enabled": True
    },
    "OpenLibrary": {
        "name": "Open Library",
        "base_url": "https://openlibrary.org",
        "search_url": "https://openlibrary.org/search.json?q={query}&limit=20",
        "works_url": "https://openlibrary.org/works/{work_id}",
        "enabled": True
    },
    "BiblioArchive": {
        "name": "SecondLife Books",
        "base_url": "https://archive.org",
        "search_url": "https://archive.org/advancedsearch.php",
        "enabled": True
    }
}
