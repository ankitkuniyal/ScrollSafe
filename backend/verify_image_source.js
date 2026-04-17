const imageUrl = 'https://images.indianexpress.com/2026/04/women_2e924c.jpg?w=1600';

async function verify() {
    try {
        const res = await fetch('http://localhost:3000/api/fact-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl })
        });
        
        const data = await res.json();
        console.log("FINAL VERDICT:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Verification failed:", e.message);
    }
}

verify();
