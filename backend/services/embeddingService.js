import { pipeline } from '@xenova/transformers';

let generateEmbedding = null;

export const loadEmbeddingModel = async () => {
    try {
        generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Local Embedding model ready!');
    } catch (err) {
        console.error('❌ Failed to load embedding model:', err);
    }
};

export const getEmbedding = async (text) => {
    if (!generateEmbedding) throw new Error('AI model is still loading, please try again in a moment.');
    const output = await generateEmbedding(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
};
