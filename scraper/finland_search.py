import json
import logging
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.suomalainen.com"
SEARCH_URL = f"{BASE_URL}/search/suggest.json"
USER_AGENT = "Mozilla/5.0 (compatible; FinnishBookSearch/1.0)"
ANTIKVARIAATTI_URL = "https://www.antikvariaatti.net/haku"
KIRJA_BASE_URL = "https://kirja.fi"
TORI_SEARCH_URL = "https://www.tori.fi/recommerce/forsale/search"
MAX_RESULTS_PER_WEBSITE = 3
IGNORED_QUERY_WORDS = {"the", "a", "an", "and", "of", "to"}


def _tag_value(tags: List[str], prefix: str) -> Optional[str]:
    for tag in tags:
        if tag.lower().startswith(prefix.lower()):
            return tag.split(":", 1)[1].strip()
    return None


def _matches_title_query(title: str, query: str) -> bool:
    query_terms = re.findall(r"[a-z0-9]+", query.casefold())
    query_terms = [term for term in query_terms if term not in IGNORED_QUERY_WORDS]
    if not query_terms:
        return True

    title_terms = re.findall(r"[a-z0-9]+", title.casefold())
    if all(term.isdigit() for term in query_terms):
        return title_terms[:len(query_terms)] == query_terms
    return all(term in title_terms for term in query_terms)


def search_books(query: str) -> List[Dict[str, Any]]:
    sources = (search_suomalainen, search_antikvariaatti, search_kirja, search_tori)
    books: List[Dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=len(sources)) as executor:
        futures = {executor.submit(source, query): source.__name__ for source in sources}
        for future in as_completed(futures):
            try:
                books.extend(future.result())
            except Exception as error:
                logging.warning("%s failed: %s", futures[future], error)

    books_by_website: Dict[str, List[Dict[str, Any]]] = {}
    for book in books:
        if not _matches_title_query(book["title"], query):
            continue
        books_by_website.setdefault(book["website"], []).append(book)

    return [
        book
        for website_books in books_by_website.values()
        for book in sorted(website_books, key=lambda listing: listing["price"])[:MAX_RESULTS_PER_WEBSITE]
    ]


def search_kirja(query: str) -> List[Dict[str, Any]]:
    response = requests.get(
        f"{KIRJA_BASE_URL}/search/suggest.json",
        params={
            "q": query,
            "resources[type]": "product",
            "resources[limit]": 10,
            "resources[options][unavailable_products]": "hide",
        },
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        timeout=15,
    )
    response.raise_for_status()
    products = response.json().get("resources", {}).get("results", {}).get("products", [])
    books: List[Dict[str, Any]] = []

    for product in products:
        try:
            title = (product.get("title") or "").strip()
            price = float(product.get("price", 0))
            product_type = product.get("type") or ""
            if not title or price <= 0 or not any(
                kind in product_type.lower()
                for kind in ("kovakantinen", "pehmeäkantinen", "nidottu", "hardback", "paperback")
            ):
                continue

            tags = product.get("tags") or []
            author = next((tag for tag in tags if re.fullmatch(r"[A-ZÅÄÖ][A-Za-zÅÄÖåäö .'-]{2,50}", tag) and " " in tag), None)
            isbn_match = re.search(r"(?<!\d)97[89]\d{10}(?!\d)", " ".join(tags) + " " + product.get("handle", ""))
            image = product.get("image") or (product.get("featured_image") or {}).get("url")
            product_url = product.get("url") or f"/products/{product.get('handle', '')}"
            books.append({
                "title": title,
                "author": author or "Unknown Author",
                "isbn": isbn_match.group(0) if isbn_match else None,
                "edition": product_type or None,
                "condition": "New",
                "price": price,
                "currency": "EUR",
                "availability": "In Stock" if product.get("available") else "Out of Stock",
                "sourceUrl": urljoin(KIRJA_BASE_URL, product_url),
                "website": "Kirja.fi",
                "coverImage": urljoin(KIRJA_BASE_URL, image) if image else None,
            })
        except (TypeError, ValueError):
            logging.exception("Could not parse a Kirja.fi book listing")

    return books


def search_tori(query: str) -> List[Dict[str, Any]]:
    response = requests.get(
        TORI_SEARCH_URL,
        params={"sub_category": "1.86.5209", "q": f"{query} kirja"},
        headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
        timeout=15,
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    books: List[Dict[str, Any]] = []
    query_terms = re.findall(r"[a-z0-9]+", query.casefold())
    matching_terms = [term for term in query_terms if term not in {"the", "a", "an", "and", "of", "to"}]
    if not matching_terms:
        matching_terms = query_terms

    for script in soup.select('script[type="application/ld+json"]'):
        try:
            structured_data = json.loads(script.string or script.get_text())
        except (json.JSONDecodeError, TypeError):
            continue
        nodes = structured_data if isinstance(structured_data, list) else [structured_data]
        for node in nodes:
            item_list = node.get("mainEntity") or node
            if item_list.get("@type") != "ItemList":
                continue
            for listing in item_list.get("itemListElement", []):
                item = listing.get("item") or {}
                title = (item.get("name") or "").strip()
                title_terms = re.findall(r"[a-z0-9]+", title.casefold())
                if re.search(r"\b(vaihto|vaihdetaan|vaihtaa|exchange|swap)\b", title, re.IGNORECASE):
                    continue
                if matching_terms and not all(term in title_terms for term in matching_terms):
                    continue
                if matching_terms and all(term.isdigit() for term in matching_terms):
                    if title_terms[:len(matching_terms)] != matching_terms:
                        continue
                offer = item.get("offers") or {}
                image = item.get("image")
                try:
                    price = float(offer.get("price", 0))
                except (TypeError, ValueError):
                    continue
                if not title or price <= 0:
                    continue
                books.append({
                    "title": title,
                    "author": "Unknown Author",
                    "isbn": None,
                    "edition": None,
                    "condition": "Used",
                    "price": price,
                    "currency": "EUR",
                    "availability": "In Stock",
                    "sourceUrl": item.get("url"),
                    "website": "Tori.fi",
                    "coverImage": image,
                })

    return books


def search_suomalainen(query: str) -> List[Dict[str, Any]]:
    params = {
        "q": query,
        "resources[type]": "product",
        "resources[limit]": 10,
        "resources[options][unavailable_products]": "hide",
    }
    response = requests.get(
        SEARCH_URL,
        params=params,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        timeout=15,
    )
    response.raise_for_status()
    products = response.json().get("resources", {}).get("results", {}).get("products", [])

    books: List[Dict[str, Any]] = []
    for product in products:
        try:
            price = float(product.get("price", 0))
            title = (product.get("title") or "").strip()
            if not title or price <= 0:
                continue

            tags = product.get("tags") or []
            author = _tag_value(tags, "Kirjoittaja:")
            isbn = _tag_value(tags, "ISBN:")
            if not author and not isbn:
                continue
            product_url = product.get("url") or f"/products/{product.get('handle', '')}"
            image = product.get("image")
            books.append({
                "title": title,
                "author": author or "Unknown Author",
                "isbn": isbn,
                "edition": product.get("type") or None,
                "condition": "New",
                "price": price,
                "currency": "EUR",
                "availability": "In Stock" if product.get("available") else "Out of Stock",
                "sourceUrl": urljoin(BASE_URL, product_url),
                "website": "Suomalainen.com",
                "coverImage": urljoin(BASE_URL, image) if image else None,
            })
        except (TypeError, ValueError):
            logging.exception("Could not parse a Finnish book listing")

    return books


def search_antikvariaatti(query: str) -> List[Dict[str, Any]]:
    response = requests.get(
        ANTIKVARIAATTI_URL,
        params={"type": "1", "q": query},
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    books: List[Dict[str, Any]] = []

    for item in soup.select(".search_result_product"):
        title_tag = item.select_one(".search_result_product_title")
        link_tag = item.select_one("a.search_result_product_text_link")
        price_tag = item.select_one(".product_price")
        if not title_tag or not link_tag or not price_tag:
            continue

        title = title_tag.get_text(" ", strip=True).rstrip("…")
        raw_price = re.sub(r"[^0-9,.-]", "", price_tag.get_text(" ", strip=True))
        try:
            price = float(raw_price.replace(",", "."))
        except ValueError:
            continue
        if not title or price <= 0:
            continue

        image_tag = item.select_one(".search_result_product_image_container img")
        image_url = image_tag.get("src") if image_tag else None
        if image_url and "placeholder" in image_url.lower():
            image_url = None
        issuer = item.select_one(".search_result_product_issuer")
        listing_path = link_tag.get("href")
        books.append({
            "title": title,
            "author": issuer.get_text(" ", strip=True).split(",", 1)[0] if issuer else "Unknown Author",
            "isbn": None,
            "edition": None,
            "condition": "Used",
            "price": price,
            "currency": "EUR",
            "availability": "In Stock",
            "sourceUrl": urljoin(ANTIKVARIAATTI_URL, listing_path),
            "website": "Antikvariaatti.net",
            "coverImage": urljoin(ANTIKVARIAATTI_URL, image_url) if image_url else None,
        })

    return books


if __name__ == "__main__":
    logging.basicConfig(stream=sys.stderr, level=logging.WARNING)
    try:
        print(json.dumps(search_books(" ".join(sys.argv[1:]).strip()), ensure_ascii=True))
    except requests.RequestException as error:
        logging.error("Finnish book search failed: %s", error)
        sys.exit(1)
