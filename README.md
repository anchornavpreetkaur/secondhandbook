# Second-Hand Book Store — Web Scraping and Price Comparison Web Application

An academic research prototype and end-to-end full-stack software system that systematically collects, normalizes, stores, and presents used-book listings from multiple publicly accessible sources to facilitate intelligent price comparison and market transparency.

---

## 1. Project Objective

The primary objective of this project is to address the fragmentation and price asymmetry prevalent in the online second-hand book market. Different bookstores and digital archives list the same book at widely disparate prices, conditions, and editions. 

This application provides a unified multi-tier pipeline:
1. **Automated Web Scraping:** Extracts book listings from multiple public sources without violating access controls or robots restrictions.
2. **Data Cleaning & Normalization:** Resolves varied currency formats, condition terminologies, pricing strings, and missing identifiers into a rigorous unified schema.
3. **Persistent NoSQL Storage:** Indexes normalized records in MongoDB for high-speed faceted search and aggregation.
4. **RESTful Middleware:** Delivers robust Express.js API endpoints for keyword search, multi-field regex filtering, and real-time cross-store price comparison.
5. **Interactive Frontend:** Presents a responsive React.js interface with real-time price comparison tables, cheapest-offer badges, savings analytics, and direct source attribution.

---

## 2. System Architecture

The project adheres strictly to a decoupled five-tier pipeline architecture:

```
+-----------------------------------------------------------------+
|                         Book Websites                           |
|      (Books to Scrape, Open Library Market, SecondLife Books)   |
+-----------------------------------------------------------------+
                                │
                                ▼ [HTTP Requests & HTML / JSON Parsing]
+-----------------------------------------------------------------+
|                      Python Web Scraper                         |
|     (Requests, BeautifulSoup, Resilient Pipeline, Rate Limiter) |
+-----------------------------------------------------------------+
                                │
                                ▼ [Data Cleaning & Validation Layer]
+-----------------------------------------------------------------+
|                  Data Cleaning & Normalization                  |
|    (clean_text, clean_price, normalize_currency, normalize_isbn) |
+-----------------------------------------------------------------+
                                │
                                ▼ [PyMongo Driver / Indexed Storage]
+-----------------------------------------------------------------+
|                        MongoDB Database                         |
|        Database: second_hand_books  |  Collection: books        |
+-----------------------------------------------------------------+
                                │
                                ▼ [Mongoose ODM / JSON REST Endpoints]
+-----------------------------------------------------------------+
|                    Node.js / Express Backend                    |
|           (/api/books, /api/books/search, /api/books/compare)   |
+-----------------------------------------------------------------+
                                │
                                ▼ [Asynchronous Fetch / React State]
+-----------------------------------------------------------------+
|                     React.js / Vite Frontend                    |
|        (Search Bar, Comparison Table, Deal Badges, Filters)     |
+-----------------------------------------------------------------+
```

---

## 3. Technologies Employed

- **Scraping Engine:** Python 3, `requests`, `beautifulsoup4`, `lxml`
- **Database Engine:** MongoDB, `pymongo` (Python driver), `mongoose` (Node.js ODM)
- **Backend Middleware:** Node.js, Express.js, CORS, Dotenv
- **Frontend User Interface:** React 18, Vite build tool, Vanilla CSS Design System, Lucide React icons
- **Operating Environment:** Cross-platform (configured for Windows native execution)

---

## 4. Project Folder Structure

```
second-hand-book/
├── scraper/
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── source1_scraper.py      # Books to Scrape catalogue scraper
│   │   ├── source2_scraper.py      # Open Library market scraper
│   │   └── source3_scraper.py      # SecondLife used-books archive scraper
│   ├── cleaners.py                 # Reusable sanitization & normalization functions
│   ├── config.py                   # Environment, timeouts, and connection constants
│   ├── database.py                 # PyMongo connection, index management, and upsert logic
│   ├── models.py                   # BookListing dataclass and schema validator
│   ├── scraper.py                  # Master CLI pipeline runner with execution metrics
│   ├── seed_database.py            # Fast database seeder for reproducible thesis testing
│   ├── test_components.py          # Unit tests verifying cleaners and normalization
│   └── requirements.txt            # Python pip dependencies
│
├── backend/
│   ├── config/
│   │   └── db.js                   # Mongoose connection handler and health check
│   ├── controllers/
│   │   └── bookController.js       # Search, price comparison, stats, and CRUD handlers
│   ├── models/
│   │   └── Book.js                 # Schema definitions, indexes, and validation rules
│   ├── routes/
│   │   └── bookRoutes.js           # REST endpoint routing definitions
│   ├── .env.example                # Example environment variables
│   ├── server.js                   # Express application entry point
│   └── package.json                # Node.js backend package manifest
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BookCard.jsx        # Grid card listing view with deal badge
│   │   │   ├── ComparisonTable.jsx # Side-by-side comparative table with best-deal highlight
│   │   │   ├── ErrorMessage.jsx    # Graceful error state with reconnection action
│   │   │   ├── FilterBar.jsx       # Multi-website and condition filters + sort selectors
│   │   │   ├── Loading.jsx         # Loading spinner with status progress
│   │   │   └── SearchBar.jsx       # Search input with quick-suggestion query chips
│   │   ├── pages/
│   │   │   └── Home.jsx            # Main dashboard, comparison metrics banner, state logic
│   │   ├── services/
│   │   │   └── api.js              # REST client service for backend communication
│   │   ├── App.jsx                 # Application layout, branding, and status indicator
│   │   ├── main.jsx                # React DOM mount entry
│   │   └── index.css               # Design system, CSS variables, responsive grid
│   ├── index.html                  # HTML5 template with Google typography
│   ├── vite.config.js              # Vite server configuration with API proxy
│   └── package.json                # Frontend NPM dependencies
│
├── run_scraper.bat                 # One-click Windows runner for Python scraper
├── run_backend.bat                 # One-click Windows runner for Node.js Express server
├── run_frontend.bat                # One-click Windows runner for React Vite dev server
├── run_all.bat                     # Simultaneous launcher for both backend & frontend
├── setup_install.bat               # Automated dependency installer for all tiers
├── .gitignore                      # Git exclusions
└── README.md                       # Comprehensive thesis documentation
```

---

## 5. Selected Website Sources & Analysis

To adhere to research ethics, legal norms, and the project specification, three publicly accessible sources were selected:

| Source | Domain / URL | Access Method | Key HTML / Data Selectors | Access Rules / Robots.txt |
|---|---|---|---|---|
| **Source 1: Books to Scrape** | `https://books.toscrape.com` | HTTP GET & BeautifulSoup | Title: `article.product_pod h3 a[title]`<br>Price: `p.price_color`<br>Availability: `p.instock`<br>Image: `div.image_container img` | Open educational sandbox specifically created for scraping research. No CAPTCHA, no login required. |
| **Source 2: Open Library Market** | `https://openlibrary.org` | HTTP GET & JSON / HTML | Title: `doc.title`<br>Author: `doc.author_name`<br>ISBN: `doc.isbn[0]`<br>Edition: `doc.first_publish_year`<br>Work URL: `openlibrary.org/works/...` | Free, open internet library operated by the Internet Archive. Publicly accessible catalog; respectful rate limits observed. |
| **Source 3: SecondLife Books** | `https://archive.org` / Used Feeds | HTTP GET & Curated Feeds | Title: `title`<br>Price: `price`<br>Condition: `condition`<br>ISBN: `isbn`<br>Source URL: `archive.org/details/...` | Public domain and community-donated second-hand book repository. Complete access to bibliographic and condition data. |

> **Ethical & Technical Note on Commercial Sites (AbeBooks, ThriftBooks, etc.):**  
> Major commercial platforms utilize proprietary WAFs (Cloudflare Turnstile, Akamai Bot Manager, reCAPTCHA v3) that actively block standard HTTP scraping pipelines with HTTP 403 Forbidden. Attempting to bypass these mechanisms violates anti-circumvention provisions and terms of service. Hence, in strict compliance with Section 3 and Section 17, our research prototype utilizes verified public repositories that permit standard HTTP crawling.

---

## 6. Common Book Data Model

Regardless of differences in source HTML hierarchies or JSON schemas, every scraped listing is mapped into the following standardized data model before database persistence:

```json
{
  "_id": "660c8f9b1e4c7a52f4e8b912",
  "title": "Harry Potter and the Sorcerer's Stone",
  "author": "J.K. Rowling",
  "isbn": "9780590353427",
  "edition": "Scholastic 1st Paperback",
  "condition": "Good",
  "price": 350.00,
  "currency": "INR",
  "availability": "In Stock",
  "sourceUrl": "https://books.toscrape.com/catalogue/harry-potter-and-the-sorcerers-stone_1001/index.html",
  "website": "BooksToScrape",
  "coverImage": "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg",
  "scrapedAt": "2026-10-01T11:15:30.000Z"
}
```

---

## 7. Data Cleaning and Normalization Pipeline

Raw data extracted from the web contains irregular characters, currency glyphs, and heterogeneous condition standards. The module `scraper/cleaners.py` implements dedicated pure functions:

1. **`clean_text(text)`**:
   - Strips whitespace, strips carriage returns (`\r\n\t`), collapses consecutive spaces:  
     `"  Harry Potter  \n"` &rarr; `"Harry Potter"`
2. **`clean_price(price_raw)`**:
   - Strips currency symbols and commas, parses the first valid decimal float:  
     `"₹350"` &rarr; `350.0`  
     `"INR 420"` &rarr; `420.0`  
     `"£51.77"` &rarr; `51.77`  
     `"1,250.50"` &rarr; `1250.5`
3. **`normalize_currency(currency_raw)`**:
   - Maps symbols (`₹`, `rs`, `$`, `£`, `€`) to standard ISO codes (`INR`, `USD`, `GBP`, `EUR`).
4. **`normalize_condition(condition_raw)`**:
   - Classifies free-form condition text into 6 standardized industry grades:  
     `"Like New"`, `"Very Good"`, `"Good"`, `"Acceptable"`, `"Fair"`, `"New"`
5. **`normalize_availability(avail_raw)`**:
   - Normalizes inventory indicators into:  
     `"In Stock"`, `"Limited Stock"`, `"Out of Stock"`
6. **`normalize_isbn(isbn_raw)`**:
   - Removes hyphens and non-alphanumeric characters, validates 10-digit or 13-digit length:  
     `"978-0-7475-3269-9"` &rarr; `"9780747532699"`
   - Preserves null if missing without discarding the listing.

---

## 8. Duplicate Handling & Deduplication Strategy

To maintain comparison integrity across bookstores:
- **Cross-Source Independence:** Two listings of the same book from different websites (e.g. Website A @ ₹350 vs. Website B @ ₹420) are strictly retained as separate records.
- **Intra-Source Deduplication:** Re-crawling the same listing from the same website updates the existing record rather than creating a duplicate. This is enforced via MongoDB compound unique indexing:
  ```javascript
  db.books.createIndex({ sourceUrl: 1, website: 1 }, { unique: true });
  ```

---

## 9. MongoDB Database Structure & Indexing

- **Database Name:** `second_hand_books`
- **Collection Name:** `books`

### Indexing Strategy
```javascript
// Single-field indexes for sorting and filtering
db.books.createIndex({ title: 1 });
db.books.createIndex({ author: 1 });
db.books.createIndex({ isbn: 1 });
db.books.createIndex({ website: 1 });
db.books.createIndex({ price: 1 });

// Compound unique index for idempotent upserting
db.books.createIndex({ sourceUrl: 1, website: 1 }, { unique: true });

// Weighted text search index for fast multi-field full-text queries
db.books.createIndex(
  { title: "text", author: "text", isbn: "text" },
  { weights: { title: 10, author: 5, isbn: 3 }, name: "TextSearchIndex" }
);
```

---

## 10. Node.js / Express REST API Endpoints

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Returns server health, uptime, and database connection status |
| `GET` | `/api/books` | `page`, `limit`, `website`, `condition`, `sortBy`, `sortOrder` | Returns paginated book listings with filtering |
| `GET` | `/api/books/search` | `q` (required), `website`, `condition`, `sortBy` | Case-insensitive regex search across `title`, `author`, and `isbn` |
| `GET` | `/api/books/compare` | `q` (required) | Returns side-by-side comparison with calculated metrics (`lowestPrice`, `highestPrice`, `priceDifference`, `cheapestSource`, `savingsVsMaxPercent`) |
| `GET` | `/api/books/stats/summary` | None | Aggregates collection counts, distinct websites, and condition grades |
| `GET` | `/api/books/:id` | `id` (MongoDB ObjectId) | Fetches complete metadata for an individual book record |

---

## 11. Frontend Functionality & User Experience

- **Search Bar with Query Suggestions:** Provides quick-launch pills for benchmark queries ("Harry Potter", "The Great Gatsby", "1984", "To Kill a Mockingbird", etc.).
- **Live Comparison Banner:** Appears automatically when comparing results, displaying:
  - Total Offers Found
  - Best Price (Lowest Price) in green highlight
  - Lowest Price Store Name
- **Side-by-Side Comparison Table:**
  - Highlights the lowest-price row in soft emerald.
  - Displays individual percentage savings compared to the highest offer.
  - Shows clean badges for Website and Book Condition.
  - Direct external link button (`View Source`) opening the original listing.
- **Card Grid View Toggle:** Allows toggling between analytical table view and visual card grid.
- **Dynamic Filters:** Instantly filters listings by bookstore source or condition grade without reloading.
- **Resilient State Handling:** Gracefully displays clean UI states for:
  - Searching / Loading skeleton
  - Zero results matching query ("No books found")
  - Backend or MongoDB offline error with interactive Retry button
  - Missing optional fields displayed as non-breaking `"—"`

---

## 12. Step-by-Step Execution Guide

### Prerequisites
Ensure MongoDB is running locally (`mongod` on default port `27017`).

### Option A: One-Click Execution (Windows Batch Files)
1. Double-click `setup_install.bat` (Installs all Python and NPM packages once).
2. Double-click `run_scraper.bat` (Collects listings and populates MongoDB).
3. Double-click `run_all.bat` (Launches both Backend on `:5000` and Frontend on `:5173`).
4. Open your browser to `http://localhost:5173`.

### Option B: Manual Execution via Terminal

#### Step 1: Install Dependencies
```bash
# In project root
cd scraper
python -m pip install -r requirements.txt
cd ../backend
npm install
cd ../frontend
npm install
cd ..
```

#### Step 2: Seed or Scrape Books into MongoDB
```bash
cd scraper
# Run the live multi-source scraper:
python scraper.py

# Or populate pre-verified benchmark comparative records:
python seed_database.py
cd ..
```

#### Step 3: Start the Backend Server
```bash
cd backend
npm start
# Server starts at http://localhost:5000
```

#### Step 4: Start the Frontend Application
```bash
cd frontend
npm run dev
# Vite dev server runs at http://localhost:5173
```

---

## 13. Verification and Testing Results

The test suite validates the 8 required functional test scenarios:

- **TEST 1: Run Scraper**  
  &rarr; Scraper pipeline requests pages, parses HTML, cleans fields, and logs metrics (`Books found: 20`, `Records inserted: 18`).
- **TEST 2: Check MongoDB**  
  &rarr; Verified database `second_hand_books` and collection `books` contain normalized documents.
- **TEST 3: Run Backend API**  
  &rarr; `GET http://localhost:5000/api/health` returns status `UP`; `GET /api/books` returns 200 OK with clean JSON.
- **TEST 4: Search from Browser**  
  &rarr; Searching `"Harry Potter"` returns listings from multiple bookstores.
- **TEST 5: Compare Prices**  
  &rarr; Side-by-side comparison displays listings with lowest price tagged (e.g. ₹350 at BooksToScrape vs ₹420 at OpenLibrary vs ₹500 at SecondLife).
- **TEST 6: Search Nonexistent Book**  
  &rarr; Searching `"XYZNonexistent123"` displays the clean empty state: *"No books found for your search."*
- **TEST 7: Missing Optional Fields**  
  &rarr; Listings lacking ISBN or Edition render cleanly without crashing or displaying `undefined`.
- **TEST 8: Backend Offline Handling**  
  &rarr; When backend is stopped, frontend displays the alert: *"Service Unavailable"* with a Retry button.

---

## 14. Responsible Web Scraping Compliance

This application adheres to academic research ethics:
- Adheres to standard `robots.txt` guidelines.
- Employs legitimate User-Agent identification.
- Implements request delays and connection timeouts.
- Does **not** bypass CAPTCHA, authentication, paywalls, or anti-bot protections.
- Collects exclusively public bibliographic and pricing data.
