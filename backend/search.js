import { QdrantClient } from '@qdrant/js-client-rest';
import { pipeline } from '@xenova/transformers';

// Initialize Qdrant Client (reusing the same credentials)
const client = new QdrantClient({
    url: 'https://b17341c0-cbf6-460b-a452-bb065549b65f.eu-west-2-0.aws.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Y2QxYTllNTgtNjc2OC00NWI4LWJkNWItMDlmZjhjNGFkZDlhIn0.BhvkbvyYxi8SLSE--QyHbu5TcxMs2OEsAvC452u1o8k',
});

const COLLECTION_NAME = 'scrollsafe_claims';

async function searchQdrant(queryText) {
    console.log(`Searching for: "${queryText}"\n`);
    
    console.log('Loading embedding model...');
    // We must use the exact same embedding model that we used during ingestion
    const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log('Generating vector for the query...');
    const output = await generateEmbedding(queryText, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    console.log('Querying Qdrant database...');
    // Perform vector similarity search
    const searchResults = await client.search(COLLECTION_NAME, {
        vector: queryVector,
        limit: 3, // Change this to return more / fewer results
        with_payload: true, // Crucial: this tells Qdrant to return the data we ingested
    });

    console.log('\n================ SEARCH RESULTS ================');
    if (searchResults.length === 0) {
        console.log('No results found.');
        return;
    }

    searchResults.forEach((result, index) => {
        console.log(`\n--- Result #${index + 1} (Similarity Score: ${result.score.toFixed(4)}) ---`);
        console.log(`Label:         ${result.payload.label?.toUpperCase()}`);
        console.log(`Claim:         ${result.payload.claim}`);
        console.log(`Explanation:   ${result.payload.explanation}`);
        console.log(`Fact Checkers: ${result.payload.fact_checkers}`);
        console.log(`Publish Date:  ${result.payload.date_published}`);
    });
    console.log('\n================================================');
}

// Allow passing a query via terminal arguments (e.g., node search.js "my custom query")
// Alternatively, fallback to a default mock query 
const userQuery = process.argv.slice(2).join(' ') || "Does a new supplement boost brain function?";

searchQdrant(userQuery).catch(console.error);
