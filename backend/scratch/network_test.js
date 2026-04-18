import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

async function test() {
    const urls = [
        'https://api.cognitive.microsofttranslator.com',
        'https://generativelanguage.googleapis.com',
        'https://b17341c0-cbf6-460b-a452-bb065549b65f.eu-west-2-0.aws.cloud.qdrant.io:6333'
    ];

    for (const url of urls) {
        console.log(`Testing ${url}...`);
        try {
            const start = Date.now();
            const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
            console.log(`✅ Success: ${url} (Status: ${res.status}) in ${Date.now() - start}ms`);
        } catch (e) {
            console.error(`❌ Failed: ${url}`);
            console.error(`   Error: ${e.message}`);
            if (e.cause) console.error(`   Cause: ${e.cause.message || e.cause}`);
        }
    }
}

test();
