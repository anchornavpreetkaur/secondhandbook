"""
Unit & Integration Test Suite for Second-Hand Book Scraper & Cleaner
Validates requirements from Sections 5, 6, 7, and 8 of the thesis specification.
"""
import unittest
from datetime import datetime
from cleaners import (
    clean_text,
    clean_price,
    normalize_currency,
    normalize_condition,
    normalize_availability,
    normalize_isbn,
)
from models import BookListing

class TestDataCleaningAndNormalization(unittest.TestCase):
    def test_clean_text(self):
        self.assertEqual(clean_text("  Harry Potter  "), "Harry Potter")
        self.assertEqual(clean_text("Harry\n\nPotter\tEdition"), "Harry Potter Edition")
        self.assertEqual(clean_text(None), "")
        self.assertEqual(clean_text(""), "")

    def test_clean_price(self):
        # Specific requirements from Section 6
        self.assertEqual(clean_price("₹350"), 350.0)
        self.assertEqual(clean_price("INR 420"), 420.0)
        self.assertEqual(clean_price("£51.77"), 51.77)
        self.assertEqual(clean_price("$ 12.99"), 12.99)
        self.assertEqual(clean_price("1,250.50"), 1250.50)
        self.assertEqual(clean_price(350), 350.0)
        self.assertEqual(clean_price(None), None)
        self.assertEqual(clean_price(""), None)

    def test_normalize_currency(self):
        self.assertEqual(normalize_currency("₹"), "INR")
        self.assertEqual(normalize_currency("rs 350"), "INR")
        self.assertEqual(normalize_currency("INR"), "INR")
        self.assertEqual(normalize_currency("£"), "GBP")
        self.assertEqual(normalize_currency("$"), "USD")
        self.assertEqual(normalize_currency("€"), "EUR")

    def test_normalize_condition(self):
        self.assertEqual(normalize_condition("like new"), "Like New")
        self.assertEqual(normalize_condition("As New / Mint"), "Like New")
        self.assertEqual(normalize_condition("very good condition"), "Very Good")
        self.assertEqual(normalize_condition("acceptable, worn edges"), "Acceptable")
        self.assertEqual(normalize_condition("fair reading copy"), "Fair")
        self.assertEqual(normalize_condition(None), "Good")

    def test_normalize_availability(self):
        self.assertEqual(normalize_availability("in stock (20 available)"), "In Stock")
        self.assertEqual(normalize_availability("sold out"), "Out of Stock")
        self.assertEqual(normalize_availability("only 2 left in stock"), "Limited Stock")
        self.assertEqual(normalize_availability(None), "In Stock")

    def test_normalize_isbn(self):
        self.assertEqual(normalize_isbn("978-0-7475-3269-9"), "9780747532699")
        self.assertEqual(normalize_isbn("0-7475-3269-9"), "0747532699")
        self.assertIsNone(normalize_isbn(""))
        self.assertIsNone(normalize_isbn("invalid_isbn"))

    def test_common_book_model(self):
        book = BookListing(
            title="  Harry Potter and the Philosopher's Stone  ",
            price="₹350",
            source_url="https://example.com/books/1",
            website="Website A",
            author="J.K. Rowling",
            isbn="978-0-7475-3269-9",
            condition="Good",
            currency="INR"
        )
        self.assertTrue(book.is_valid())
        data = book.to_dict()
        self.assertEqual(data["title"], "Harry Potter and the Philosopher's Stone")
        self.assertEqual(data["price"], 350.0)
        self.assertEqual(data["currency"], "INR")
        self.assertEqual(data["isbn"], "9780747532699")
        self.assertEqual(data["website"], "Website A")
        self.assertIn("scrapedAt", data)

    def test_model_missing_optional_fields(self):
        # A record with missing optional ISBN and edition should remain valid!
        book = BookListing(
            title="Vintage Book Without ISBN",
            price="250",
            source_url="https://example.com/book2",
            website="Website B"
        )
        self.assertTrue(book.is_valid())
        data = book.to_dict()
        self.assertIsNone(data["isbn"])
        self.assertIsNone(data["edition"])
        self.assertEqual(data["author"], "Unknown Author")
        self.assertEqual(data["price"], 250.0)

if __name__ == "__main__":
    unittest.main()
