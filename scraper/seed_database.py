"""
Seed script to pre-populate MongoDB with multi-source benchmark book listings
for immediate thesis testing and offline demonstration of price comparison.
"""
from database import MongoDatabase
from models import BookListing

SAMPLE_BENCHMARK_BOOKS = [
    # --- Harry Potter multi-source comparison ---
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "edition": "Scholastic Paperback",
        "condition": "Acceptable",
        "price": 220.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BookChor",
        "sourceUrl": "https://www.bookchor.com/book/9780590353427/harry-potter-sorcerers-stone",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "edition": "Bloomsbury Paperback",
        "condition": "Good",
        "price": 280.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "ThriftBooks",
        "sourceUrl": "https://www.thriftbooks.com/w/harry-potter-and-the-sorcerers-stone_j-k-rowling/245719/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "edition": "Scholastic 1st Paperback",
        "condition": "Good",
        "price": 350.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BooksToScrape",
        "sourceUrl": "https://books.toscrape.com/catalogue/harry-potter-and-the-sorcerers-stone_1001/index.html",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "edition": "Arthur A. Levine Hardcover",
        "condition": "Very Good",
        "price": 390.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "AbeBooks",
        "sourceUrl": "https://www.abebooks.com/servlet/SearchResults?isbn=9780590353427",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "edition": "Bloomsbury Special Edition",
        "condition": "Very Good",
        "price": 420.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "OpenLibrary Market",
        "sourceUrl": "https://openlibrary.org/works/OL82563W/Harry_Potter_and_the_Philosopher_s_Stone",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "isbn": "9780590353427",
        "edition": "Hardcover Collector's Edition",
        "condition": "Like New",
        "price": 500.0,
        "currency": "INR",
        "availability": "Limited Stock",
        "website": "SecondLife Books",
        "sourceUrl": "https://archive.org/search?query=Harry+Potter",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780590353427-M.jpg"
    },

    # --- The Great Gatsby comparison ---
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "edition": "Pocket Books",
        "condition": "Good",
        "price": 149.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BookChor",
        "sourceUrl": "https://www.bookchor.com/book/9780743273565/the-great-gatsby",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "edition": "Penguin Modern Classics",
        "condition": "Acceptable",
        "price": 180.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "OpenLibrary Market",
        "sourceUrl": "https://openlibrary.org/works/OL468516W/The_Great_Gatsby",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "edition": "Scribner Trade Edition",
        "condition": "Good",
        "price": 195.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "ThriftBooks",
        "sourceUrl": "https://www.thriftbooks.com/w/the-great-gatsby_f-scott-fitzgerald/245856/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "edition": "Scribner Trade Paperback",
        "condition": "Good",
        "price": 220.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BooksToScrape",
        "sourceUrl": "https://books.toscrape.com/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "edition": "F. Scott Fitzgerald Classic",
        "condition": "Very Good",
        "price": 275.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "AbeBooks",
        "sourceUrl": "https://www.abebooks.com/servlet/SearchResults?isbn=9780743273565",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "edition": "Centennial Hardcover",
        "condition": "Like New",
        "price": 310.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "SecondLife Books",
        "sourceUrl": "https://archive.org/search?query=The+Great+Gatsby",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg"
    },

    # --- 1984 comparison ---
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "edition": "Penguin Essentials",
        "condition": "Fair",
        "price": 150.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "OpenLibrary Market",
        "sourceUrl": "https://openlibrary.org/works/OL1168007W/1984",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "edition": "Fingerprint Publishing",
        "condition": "Good",
        "price": 165.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BookChor",
        "sourceUrl": "https://www.bookchor.com/book/9780451524935/1984",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "edition": "Signet Classic",
        "condition": "Good",
        "price": 190.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BooksToScrape",
        "sourceUrl": "https://books.toscrape.com/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "edition": "Signet 50th Anniversary",
        "condition": "Very Good",
        "price": 210.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "ThriftBooks",
        "sourceUrl": "https://www.thriftbooks.com/w/1984_george-orwell/245842/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "edition": "Plume Trade Paperback",
        "condition": "Very Good",
        "price": 250.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "AbeBooks",
        "sourceUrl": "https://www.abebooks.com/servlet/SearchResults?isbn=9780451524935",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "isbn": "9780451524935",
        "edition": "Harvill Secker Hardback",
        "condition": "Very Good",
        "price": 280.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "SecondLife Books",
        "sourceUrl": "https://archive.org/search?query=1984+George+Orwell",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg"
    },

    # --- To Kill a Mockingbird ---
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780060935467",
        "edition": "Vintage Paperback",
        "condition": "Good",
        "price": 199.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BookChor",
        "sourceUrl": "https://www.bookchor.com/book/9780060935467/to-kill-a-mockingbird",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780060935467",
        "edition": "Warner Books Paperback",
        "condition": "Acceptable",
        "price": 240.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "ThriftBooks",
        "sourceUrl": "https://www.thriftbooks.com/w/to-kill-a-mockingbird_harper-lee/245851/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780060935467",
        "edition": "Harper Perennial",
        "condition": "Good",
        "price": 290.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BooksToScrape",
        "sourceUrl": "https://books.toscrape.com/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780060935467",
        "edition": "HarperCollins Paperback",
        "condition": "Very Good",
        "price": 310.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "OpenLibrary Market",
        "sourceUrl": "https://openlibrary.org/works/OL5976544W/To_Kill_a_Mockingbird",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780060935467",
        "edition": "Harper Classic Hardcover",
        "condition": "Very Good",
        "price": 340.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "AbeBooks",
        "sourceUrl": "https://www.abebooks.com/servlet/SearchResults?isbn=9780060935467",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "isbn": "9780060935467",
        "edition": "50th Anniversary Edition",
        "condition": "Like New",
        "price": 380.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "SecondLife Books",
        "sourceUrl": "https://archive.org/search?query=To+Kill+a+Mockingbird",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780060935467-M.jpg"
    },

    # --- Pride and Prejudice ---
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "edition": "Rupa Classics Paperback",
        "condition": "Fair",
        "price": 175.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BookChor",
        "sourceUrl": "https://www.bookchor.com/book/9780141439518/pride-and-prejudice",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "edition": "Penguin Classics",
        "condition": "Good",
        "price": 210.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "OpenLibrary Market",
        "sourceUrl": "https://openlibrary.org/works/OL15848529W/Pride_and_Prejudice",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "edition": "Oxford World's Classics",
        "condition": "Good",
        "price": 230.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "ThriftBooks",
        "sourceUrl": "https://www.thriftbooks.com/w/pride-and-prejudice_jane-austen/245876/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "edition": "Dover Thrift Edition",
        "condition": "Very Good",
        "price": 245.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BooksToScrape",
        "sourceUrl": "https://books.toscrape.com/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "edition": "Vintage Classics",
        "condition": "Very Good",
        "price": 260.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "SecondLife Books",
        "sourceUrl": "https://archive.org/search?query=Pride+and+Prejudice",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "isbn": "9780141439518",
        "edition": "Collector's Library Hardcover",
        "condition": "Like New",
        "price": 295.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "AbeBooks",
        "sourceUrl": "https://www.abebooks.com/servlet/SearchResults?isbn=9780141439518",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg"
    },

    # --- The Hobbit ---
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "edition": "HarperCollins Paperback",
        "condition": "Acceptable",
        "price": 225.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BookChor",
        "sourceUrl": "https://www.bookchor.com/book/9780547928227/the-hobbit",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "edition": "Mariner Illustrated",
        "condition": "Acceptable",
        "price": 260.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "SecondLife Books",
        "sourceUrl": "https://archive.org/search?query=The+Hobbit+Tolkien",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "edition": "Ballantine Books Edition",
        "condition": "Good",
        "price": 280.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "ThriftBooks",
        "sourceUrl": "https://www.thriftbooks.com/w/the-hobbit_j-r-r-tolkien/245890/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "edition": "HarperCollins Paperback",
        "condition": "Good",
        "price": 310.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "OpenLibrary Market",
        "sourceUrl": "https://openlibrary.org/works/OL262412W/The_Hobbit",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "edition": "75th Anniversary Edition",
        "condition": "Very Good",
        "price": 360.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "AbeBooks",
        "sourceUrl": "https://www.abebooks.com/servlet/SearchResults?isbn=9780547928227",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "isbn": "9780547928227",
        "edition": "Deluxe Pocket Edition",
        "condition": "Like New",
        "price": 390.0,
        "currency": "INR",
        "availability": "In Stock",
        "website": "BooksToScrape",
        "sourceUrl": "https://books.toscrape.com/",
        "coverImage": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg"
    }
]

def seed():
    print("==================================================")
    print("SEEDING MONGODB WITH BENCHMARK SECOND-HAND BOOKS")
    print("==================================================")
    db = MongoDatabase()
    if not db.connect():
        print("[!] MongoDB connection failed. Please ensure mongod service is running.")
        return

    validated_records = []
    for item in SAMPLE_BENCHMARK_BOOKS:
        model = BookListing(
            title=item["title"],
            price=item["price"],
            source_url=item["sourceUrl"],
            website=item["website"],
            author=item.get("author"),
            isbn=item.get("isbn"),
            edition=item.get("edition"),
            condition=item.get("condition"),
            currency=item.get("currency", "INR"),
            availability=item.get("availability", "In Stock"),
            cover_image=item.get("coverImage")
        )
        if model.is_valid():
            validated_records.append(model.to_dict())

    stats = db.save_many(validated_records)
    print(f"Records Inserted: {stats['inserted']}")
    print(f"Records Updated:  {stats['updated']}")
    print(f"Records Skipped:  {stats['skipped']}")
    print(f"Total Database Count: {db.get_count()}")
    print("Seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed()
