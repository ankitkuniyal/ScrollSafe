export const translateClaimMiddleware = async (req, res, next) => {
    try {
        const { claim } = req.body;
        
        if (!claim || claim.trim().length === 0) {
            return next();
        }

        const key = process.env.AZURE_TRANSLATOR_KEY;
        const region = process.env.AZURE_TRANSLATOR_REGION;

        if (!key || !region) {
            console.warn("⚠️ Azure Translator credentials missing. Skipping translation.");
            return next();
        }

        console.log(`[Translation] Checking language for: "${claim.substring(0, 50)}..."`);

        const response = await fetch('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en', {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': key,
                'Ocp-Apim-Subscription-Region': region,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{ text: claim }])
        });

        if (!response.ok) {
            console.error(`Azure Translation failed with status: ${response.status}`);
            return next(); // Fail gracefully, try to process in original language
        }

        const data = await response.json();
        
        if (data && data[0] && data[0].translations && data[0].translations.length > 0) {
            const translatedText = data[0].translations[0].text;
            const detectedLang = data[0].detectedLanguage?.language || 'unknown';
            
            if (detectedLang !== 'en') {
                console.log(`✅ Translated from [${detectedLang}] to [en]: "${translatedText.substring(0, 50)}..."`);
                req.body.originalClaim = claim; // Preserve original claim
                req.body.claim = translatedText; // Intercept and mutate the claim for the fact-checking pipeline!
            } else {
                console.log(`[Translation] Claim is natively English. Skipping.`);
            }
        }

        next();
    } catch (error) {
        console.error("Translation Middleware Error:", error);
        next(); // Always fail gracefully so the fact-check doesn't crash
    }
};
