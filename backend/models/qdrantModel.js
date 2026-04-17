import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
    url: 'https://b17341c0-cbf6-460b-a452-bb065549b65f.eu-west-2-0.aws.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Y2QxYTllNTgtNjc2OC00NWI4LWJkNWItMDlmZjhjNGFkZDlhIn0.BhvkbvyYxi8SLSE--QyHbu5TcxMs2OEsAvC452u1o8k',
});
const COLLECTION_NAME = 'scrollsafe_claims';

export const searchSimilarClaims = async (queryVector) => {
    return await client.search(COLLECTION_NAME, {
        vector: queryVector,
        limit: 3, 
        with_payload: true, 
    });
};
