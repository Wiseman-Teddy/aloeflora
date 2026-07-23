async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/gemini/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Hello', catalog: [], faqs: [] })
    });
    console.log(res.status);
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}
test();
