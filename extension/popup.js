document.addEventListener('DOMContentLoaded', () => {
    const apiSection = document.getElementById('apiSection');
    const settingsToggle = document.getElementById('settingsToggle');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const textInput = document.getElementById('textInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultDiv = document.getElementById('result');

    chrome.storage.local.get(['GoogleApiKey'], (result) => {
        if (!result.apiKey) {
            apiSection.classList.remove('hidden');
        }
    });

    settingsToggle.addEventListener('click', () => {
        apiSection.classList.toggle('hidden');
    });

    saveApiKeyBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) return;

        try {
            const testResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: "user",
                            parts: [{ text: "Test" }]
                        }]
                    })
                }
            );

            if (!testResponse.ok) throw new Error('Invalid API key');

            await chrome.storage.local.set({ GoogleApiKey: apiKey });
            apiSection.classList.add('hidden');
            apiKeyInput.value = '';
            showResult('API key saved successfully!', 'real');
        } catch (error) {
            showResult('Invalid API key', 'fake');
        }
    });

    analyzeBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();
        if (!text) {
            showResult('Please enter some text to analyze', 'fake');
            return;
        }

        setLoading(true);

        try {
            const { apiKey } = await chrome.storage.local.get(['GoogleApiKey']);
            if (!apiKey) throw new Error('Please set up your API key first');

            const prompt = `For languages other than English, keep *all* parts of the response (the 'veracity', 'reasoning' and 'summary') in that detected language. For example, if the article is in Albanian, the 'reason' and 'summary' should be in Albanian.
                Respond *only* with a JSON object, for new lines use backslash n and don't leave empty lines as it doesn't parse as a JSON. The JSON object *must* contain these four keys: 'veracity', 'reasoning' and 'summary'. Do not include any other text outside the JSON object.
                The 'veracity' value should be one of the following strings: "Fake News", "Inconclusive", or "Real News".
                The 'reasoning' value should explain *specifically* why the text is classified as such, referencing concrete examples from the text and the search results. Clearly state what information was verified and how. Explain any discrepancies or inconsistencies found. If classified as "Inconclusive," explain what further information would be needed to make a definitive judgment. If classified as "Real News" or "Fake News," provide a concise explanation of the evidence supporting that conclusion. *This explanation must be in the same language as the provided text.*
                The 'summary' value should be a concise summary of the text's main points. *This summary should be in the same language as the provided text.*
                Be conservative in labeling text as "Fake News." Misinformation, biased reporting, or lack of context does not automatically equate to "Fake News." "Fake News" implies deliberate fabrication or significant distortion of facts. If the text presents a particular viewpoint or interpretation of events, acknowledge that but focus on the factual claims within the text.
                Consider the source of the text. Is it from a known and reputable news organization, a blog, a social media post, or an anonymous source? This context is important in evaluating the credibility of the information.
                Perform a thorough search using relevant keywords from the text to verify the claims made. Compare information from multiple sources to identify any discrepancies or inconsistencies. Prioritize information from reputable and authoritative sources.
                The article is: "${text}"?`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: "user",
                            parts: [{ text: prompt }]
                        }]
                    })
                }
            );

            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            const responseText = data.candidates[0].content.parts[0].text;
            const result = JSON.parse(responseText.replace(/```json\n|\n```/g, '').trim());
            
            showAnalysis({
                isReal: result.veracity === "Real News",
                explanation: result.reasoning,
                summary: result.summary
            });
        } catch (error) {
            showResult(error.message, 'fake');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        analyzeBtn.disabled = isLoading;
        analyzeBtn.textContent = isLoading ? 'Analyzing...' : 'Analyze Text';
    }

    function showResult(message, type) {
        resultDiv.classList.remove('hidden', 'real', 'fake');
        resultDiv.classList.add(type);
        resultDiv.textContent = message;
    }

    function showAnalysis(analysis) {
        resultDiv.classList.remove('hidden', 'real', 'fake');
        resultDiv.classList.add(analysis.isReal ? 'real' : 'fake');
        
        const confidence = Math.round(analysis.confidence * 100);
        resultDiv.innerHTML = `
            <strong>${analysis.isReal ? '✓ Real News' : '⚠ Fake News'}</strong>
            <p><strong>Explanation:</strong> ${analysis.explanation}</p>
            <p><strong>Summary:</strong> ${analysis.summary}</p>
        `;
    }
});