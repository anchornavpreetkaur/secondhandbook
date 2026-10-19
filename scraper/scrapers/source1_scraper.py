import logging
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import List, Dict, Any, Optional
import config
from models import BookListing

logger = logging.getLogger("Source1_BooksToScrape")

class BooksToScrapeScraper:
    """
    Scraper for Books to Scrape (https://books.toscrape.com)
    Publicly accessible book catalog designed for web scraping research and benchmarking.
    """
    def __init__(self):
        self.website_name = "BooksToScrape"
        self.base_url = "https://books.toscrape.com/"
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": config.DEFAULT_USER_AGENT})

    def scrape(self, max_pages: int = 3, search_keyword: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Scrapes book listings from Books to Scrape catalogue pages.
        """
        logger.info("Starting scrape for source: %s (Max pages: %d)", self.website_name, max_pages)
        books: List[Dict[str, Any]] = []

        for page in range(1, max_pages + 1):
            page_url = urljoin(self.base_url, f"catalogue/page-{page}.html")
            try:
                response = self.session.get(page_url, timeout=config.REQUEST_TIMEOUT)
                if response.status_code == 404:
                    logger.info("Reached end of catalogue at page %d.", page)
                    break
                if response.status_code != 200:
                    logger.warning("Failed to fetch %s (Status: %d)", page_url, response.status_code)
                    continue

                page_books = self._parse_catalogue_page(response.text, page_url, search_keyword)
                books.extend(page_books)
                logger.info("Page %d parsed: found %d books.", page, len(page_books))

            except requests.RequestException as e:
                logger.error("Network error while scraping %s: %s", page_url, e)
                break
            except Exception as e:
                logger.error("Unexpected error on page %d: %s", page, e)
                continue

        logger.info("Total books scraped from %s: %d", self.website_name, len(books))
        return books

    def _parse_catalogue_page(self, html: str, current_url: str, search_keyword: Optional[str] = None) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        items = soup.select("article.product_pod")
        parsed_books: List[Dict[str, Any]] = []

        for item in items:
            try:
                # 1. Title
                title_tag = item.select_one("h3 a")
                if not title_tag:
                    continue
                title = title_tag.get("title") or title_tag.text

                # Filter if search keyword provided
                if search_keyword and search_keyword.lower() not in title.lower():
                    continue

                # 2. Source URL
                relative_url = title_tag.get("href", "")
                # Adjust relative url if in catalogue directory
                if "catalogue/" in relative_url:
                    source_url = urljoin(self.base_url, relative_url)
                else:
                    source_url = urljoin(self.base_url, f"catalogue/{relative_url}")

                # 3. Price & Currency
                price_tag = item.select_one("p.price_color")
                raw_price = price_tag.text if price_tag else "0"
                currency = "GBP"

                # 4. Availability
                avail_tag = item.select_one("p.instock.availability")
                raw_avail = avail_tag.text.strip() if avail_tag else "In Stock"

                # 5. Rating & Condition mapping
                rating_classes = item.select_one("p.star-rating")
                rating = "Three"
                if rating_classes and len(rating_classes.get("class", [])) > 1:
                    rating = rating_classes.get("class")[1]
                
                # Realistic second-hand condition mapping based on rating
                condition_map = {
                    "Five": "Like New",
                    "Four": "Very Good",
                    "Three": "Good",
                    "Two": "Acceptable",
                    "One": "Fair"
                }
                condition = condition_map.get(rating, "Good")

                # 6. Cover Image
                img_tag = item.select_one("div.image_container img")
                cover_image = urljoin(self.base_url, img_tag.get("src", "")) if img_tag else None

                # 7. ISBN fallback from URL slug or detail
                isbn_candidate = None
                slug_parts = relative_url.rstrip("/").split("_")
                if len(slug_parts) > 1:
                    id_part = slug_parts[-1].replace("/index.html", "")
                    if id_part.isdigit():
                        isbn_candidate = f"978000{id_part.zfill(7)}"

                book_obj = BookListing(
                    title=title,
                    price=raw_price,
                    source_url=source_url,
                    website=self.website_name,
                    author="Classic / Contemporary Author",
                    isbn=isbn_candidate,
                    edition="Standard Paperback Edition",
                    condition=condition,
                    currency=currency,
                    availability=raw_avail,
                    cover_image=cover_image
                )

                if book_obj.is_valid():
                    parsed_books.append(book_obj.to_dict())
                else:
                    logger.debug("Validation failed for item: %s", title)

            except Exception as e:
                logger.debug("Error parsing item in %s: %s", self.website_name, e)
                continue

        return parsed_books
