import logging
from typing import Dict, Any, List, Optional
from pymongo import MongoClient, ASCENDING, TEXT
from pymongo.errors import PyMongoError, ConnectionFailure
import config

logger = logging.getLogger("Database")

class MongoDatabase:
    """
    MongoDB manager for second-hand book store comparison.
    Handles indexing, deduplication, and bulk insertion/upsertion.
    """
    def __init__(self, uri: Optional[str] = None, db_name: Optional[str] = None):
        self.uri = uri or config.MONGO_URI
        self.db_name = db_name or config.DB_NAME
        self.client: Optional[MongoClient] = None
        self.db = None
        self.books = None

    def connect(self) -> bool:
        """
        Connects to MongoDB and initializes indexes.
        """
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=4000)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            self.books = self.db[config.COLLECTION_NAME]
            self._ensure_indexes()
            logger.info("Successfully connected to MongoDB database '%s'.", self.db_name)
            return True
        except ConnectionFailure as e:
            logger.error("Failed to connect to MongoDB at %s: %s", self.uri, e)
            return False
        except Exception as e:
            logger.error("Unexpected MongoDB error: %s", e)
            return False

    def _ensure_indexes(self):
        """
        Creates appropriate indexes for fast search and price comparison.
        """
        try:
            # Single field indexes
            self.books.create_index([("title", ASCENDING)])
            self.books.create_index([("author", ASCENDING)])
            self.books.create_index([("isbn", ASCENDING)])
            self.books.create_index([("website", ASCENDING)])
            self.books.create_index([("price", ASCENDING)])

            # Compound unique index on (sourceUrl, website) to prevent exact duplicate crawls
            # while allowing the same book from multiple different websites
            self.books.create_index([("sourceUrl", ASCENDING), ("website", ASCENDING)], unique=True)

            # Text index for search across title, author, and isbn
            self.books.create_index([
                ("title", TEXT),
                ("author", TEXT),
                ("isbn", TEXT)
            ], name="book_search_text_idx")
            logger.info("MongoDB indexes verified.")
        except PyMongoError as e:
            logger.warning("Could not set up some indexes: %s", e)

    def save_book(self, book_data: Dict[str, Any]) -> str:
        """
        Upserts a book record based on sourceUrl and website.
        Returns: 'inserted', 'updated', or 'skipped'
        """
        if not self.books:
            return "skipped"

        try:
            filter_query = {
                "sourceUrl": book_data["sourceUrl"],
                "website": book_data["website"]
            }
            result = self.books.update_one(
                filter_query,
                {"$set": book_data},
                upsert=True
            )
            if result.upserted_id:
                return "inserted"
            elif result.modified_count > 0:
                return "updated"
            return "skipped"
        except PyMongoError as e:
            logger.error("Error upserting book: %s", e)
            return "skipped"

    def save_many(self, books: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Batch saves multiple books and returns count metrics.
        """
        stats = {"inserted": 0, "updated": 0, "skipped": 0}
        for book in books:
            res = self.save_book(book)
            stats[res] += 1
        return stats

    def get_count(self) -> int:
        if self.books:
            return self.books.count_documents({})
        return 0

    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")
