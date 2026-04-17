import { QdrantClient } from '@qdrant/js-client-rest';
import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

// Initialize Qdrant Client (using your provided credentials)
const client = new QdrantClient({
    url: 'https://b17341c0-cbf6-460b-a452-bb065549b65f.eu-west-2-0.aws.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Y2QxYTllNTgtNjc2OC00NWI4LWJkNWItMDlmZjhjNGFkZDlhIn0.BhvkbvyYxi8SLSE--QyHbu5TcxMs2OEsAvC452u1o8k',
});

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLLECTION_NAME = 'scrollsafe_claims';
const CSV_PATH = join(__dirname, 'cleaned_data (final).csv');

async function setupCollection() {
    try {
        const collectionsResponse = await client.getCollections();
        const exists = collectionsResponse.collections.some(c => c.name === COLLECTION_NAME);

        if (!exists) {
            console.log(`Creating collection '${COLLECTION_NAME}'...`);
            await client.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: 384, // Embedding size for 'Xenova/all-MiniLM-L6-v2'
                    distance: 'Cosine'
                }
            });
            console.log('Collection created successfully.');
        } else {
            console.log(`Collection '${COLLECTION_NAME}' already exists.`);
        }
    } catch (e) {
        console.error('Error setting up collection:', e);
        process.exit(1);
    }
}

async function ingestData() {
    await setupCollection();

    console.log('Loading embedding model (this may take a moment on first run)...');
    // Using Transformers.js and the ONNX version of MiniLM
    const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    console.log(`Reading CSV file: ${CSV_PATH}`);
    const results = [];
    
    await new Promise((resolve, reject) => {
        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });

    console.log(`Found ${results.length} rows to process.`);

    const BATCH_SIZE = 50; 
    
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
        const batch = results.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (row) => {
            // We combine the claim and main_text to create a robust embedding context
            const textToEmbed = `Claim: ${row.claim || ''}\nDetails: ${row.main_text || ''}`.trim();
            
            if (!textToEmbed) return null;

            try {
                // Generate embedding
                const output = await generateEmbedding(textToEmbed, { pooling: 'mean', normalize: true });
                const vector = Array.from(output.data);
                
                return {
                    id: uuidv5(textToEmbed, UUID_NAMESPACE),
                    vector: vector,
                    payload: {
                        claim: row.claim || '',
                        date_published: row.date_published || '',
                        explanation: row.explanation || '',
                        fact_checkers: row.fact_checkers || '',
                        main_text: row.main_text || '',
                        label: row.label || '',
                        subjects: row.subjects || ''
                    }
                };
            } catch (err) {
                console.error(`Failed to embed text for row with claim: ${row.claim}`, err);
                return null;
            }
        });
        
        const completedPoints = await Promise.all(promises);
        const points = completedPoints.filter(p => p !== null);
        
        if (points.length > 0) {
            console.log(`Pushing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(results.length / BATCH_SIZE)} (${points.length} records) to Qdrant...`);
            
            let retries = 3;
            while (retries > 0) {
                try {
                    await client.upsert(COLLECTION_NAME, { wait: true, points: points });
                    break; // Success
                } catch (netErr) {
                    retries--;
                    console.warn(`Transient error uploading batch, retries left: ${retries} (${netErr.message})`);
                    if (retries === 0) throw netErr;
                    await new Promise(r => setTimeout(r, 3000)); // wait 3s before retry
                }
            }
        }
    }
    
    console.log('Data ingestion to Qdrant has completed successfully.');
}

ingestData().catch(console.error);
