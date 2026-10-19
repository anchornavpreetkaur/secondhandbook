async function testHttp() {
  try {
    console.log('--- 1. Testing Register Endpoint ---');
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Rahul Sharma', email: 'rahul@example.com', password: 'password123' })
    });
    const regData = await regRes.json();
    console.log('Status:', regRes.status, 'Response:', regData);

    console.log('--- 2. Testing Login Endpoint ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Status:', loginRes.status, 'Response:', loginData);

    const token = loginData.token;

    console.log('--- 3. Testing Wishlist Add Endpoint with benchmark book ---');
    const bookToAdd = {
      _id: "hp-bc",
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      isbn: "9780590353427",
      edition: "Scholastic Paperback",
      condition: "Acceptable",
      price: 220.0,
      currency: "INR",
      availability: "In Stock",
      website: "BookChor",
      sourceUrl: "https://www.bookchor.com/book/9780590353427/harry-potter-sorcerers-stone",
      coverImage: "https://covers.openlibrary.org/b/isbn/9780590353427-L.jpg"
    };

    const wishRes = await fetch('http://localhost:5000/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ book: bookToAdd })
    });
    const wishData = await wishRes.json();
    console.log('Wishlist Add Status:', wishRes.status, 'Response:', wishData);

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testHttp();
