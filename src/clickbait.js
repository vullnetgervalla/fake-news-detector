import { updatePillContent } from './clickbaitPill';
import { getArticleContent } from './utils/articleExtractor';

export const isClickbait = async (pill, text, articleLink) => {
    updatePillContent(pill, true);
    const article = await getArticleContent(articleLink);
    const prompt = getPrompt(text, article.content);
    console.log(prompt)
    const model = window.currentModel;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log(responseText)
    try {
        const jsonStr = responseText.replace(/```json\n|\n```/g, '').trim();
        const response = JSON.parse(jsonStr);
        Object.assign(response, { articleLink });
        updatePillContent(pill, false, response, article);
    }
    catch (e) {
        console.error(e);
        updatePillContent(pill, false, null);
        return;
    }
};

function getPrompt(text, article) {
    return `For languages other than English, keep *all* parts of the response (the 'reason', 'summary', and any other text) in that detected language. For example, if the article is in Albanian, the 'reason' and 'summary' should be in Albanian.
    Respond *only* with a JSON object, for new lines use backslash n and don't leave empty lines as it doesn't parse as a JSON. The JSON object *must* contain these three keys: 'clickbait', 'reason', and 'summary'.  Do not include any other text outside the JSON object.
    The 'clickbait' value should be a boolean (true or false). The 'reason' value should explain *specifically* why the title is or isn't clickbait, referencing concrete examples from the title and article.  The 'summary' value should be a concise summary of the article's main points. *Both the 'reason' and 'summary' must be in the same language as the article.*
    Be conservative in labeling titles as clickbait.  A title that is slightly sensational or intriguing is not necessarily clickbait. Clickbait relies on exaggeration, misleading information, or withholding key information to manipulate clicks.  A good title that accurately reflects the article's content, even if it's attention-grabbing, is *not* clickbait.
    Is this title: "${text}", clickbait for this article: ${article}?`;
}