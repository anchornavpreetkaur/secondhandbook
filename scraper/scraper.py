import sys
import argparse
import logging
from typing import List, Dict, Any
from database import MongoDatabase
from finland_search import search_books

# Configure logging with clean format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ScraperPipeline")

def run_pipeline(search_keyword: str = None, max_pages: int = 2):
    """
    Executes the complete multi-source scraping and normalization pipeline.
    """
    print("\n==================================================")
    print("SECOND-HAND BOOK SCRAPER PIPELINE")
    print("==================================================")
    print("Starting scraper...\n")

    db = MongoDatabase()
    connected = db.connect()
    if not connected:
        logger.error("Could not connect to MongoDB. Scraped data cannot be persisted.")
        print("[!] Error: MongoDB connection failed. Please ensure MongoDB service is running.")
        return False

    total_found_all = 0
    total_inserted_all = 0
    total_updated_all = 0
    total_skipped_all = 0

    print("--------------------------------------------------")
    print("Source: Suomalainen.com")
    try:
        records = search_books(search_keyword or "kirjat")
        total_found_all = len(records)
        print(f"Books found: {total_found_all}")
        stats = db.save_many(records)
        total_inserted_all = stats["inserted"]
        total_updated_all = stats["updated"]
        total_skipped_all = stats["skipped"]
        print(f"Records inserted: {total_inserted_all}")
        print(f"Records updated:  {total_updated_all}")
        print(f"Records skipped:  {total_skipped_all}")
    except Exception as e:
        logger.error("Failed scraping Suomalainen.com: %s", e)
        print(f"[!] Error while scraping Suomalainen.com: {e}")

    total_in_db = db.get_count()
    db.close()

    print("\n==================================================")
    print("SCRAPING COMPLETED")
    print(f"Total Books Found:     {total_found_all}")
    print(f"Total Records Inserted: {total_inserted_all}")
    print(f"Total Records Updated:  {total_updated_all}")
    print(f"Total Records Skipped:  {total_skipped_all}")
    print(f"Total Collection Count: {total_in_db}")
    print("==================================================\n")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Multi-Source Second-Hand Book Scraper")
    parser.add_argument("--search", type=str, default=None, help="Target search keyword (e.g. 'Harry Potter')")
    parser.add_argument("--pages", type=int, default=2, help="Number of catalog pages to scrape for source 1")
    args = parser.parse_args()

    run_pipeline(search_keyword=args.search, max_pages=args.pages)
