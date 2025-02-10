export const checkFakeNews = async (articleContent) => {
    const prompt = getPrompt(articleContent);
    console.log(prompt)
    try {
        const model = window.currentModel;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log(responseText)
        return JSON.parse(responseText.replace(/```json\n|\n```/g, '').trim());
    } catch (error) {
        console.error('Error checking fake news:', error);
        return {
            veracity: 'Error',
            reasoning: 'Failed to analyze the article',
        };
    }
};

function getPrompt(articleContent) {
    return `For languages other than English, keep *all* parts of the response (the 'veracity', 'reasoning' and20.9 'summary') in that detected language. For example, if the article is in Albanian, the 'reason' and 'summary' should be in Albanian.
        Respond *only* with a JSON object, for new lines use backslash n and don't leave empty lines as it doesn't parse as a JSON. The JSON object *must* contain these four keys: 'veracity', 'reasoning' and 'summary'. Do not include any other text outside the JSON object.
        The 'veracity' value should be one of the following strings: "Fake News", "Inconclusive", or "Real News".
        The 'reasoning' value should explain *specifically* why the text is classified as such, referencing concrete examples from the text and the search results. Clearly state what information was verified and how. Explain any discrepancies or inconsistencies found. If classified as "Inconclusive," explain what further information would be needed to make a definitive judgment. If classified as "Real News" or "Fake News," provide a concise explanation of the evidence supporting that conclusion. *This explanation must be in the same language as the provided text.*
        The 'summary' value should be a concise summary of the text's main points. *This summary should be in the same language as the provided text.*
        Be conservative in labeling text as "Fake News." Misinformation, biased reporting, or lack of context does not automatically equate to "Fake News." "Fake News" implies deliberate fabrication or significant distortion of facts. If the text presents a particular viewpoint or interpretation of events, acknowledge that but focus on the factual claims within the text.
        Consider the source of the text. Is it from a known and reputable news organization, a blog, a social media post, or an anonymous source? This context is important in evaluating the credibility of the information.
        Perform a thorough search using relevant keywords from the text to verify the claims made. Compare information from multiple sources to identify any discrepancies or inconsistencies. Prioritize information from reputable and authoritative sources.
        The article is: "${articleContent}"?`;
}
