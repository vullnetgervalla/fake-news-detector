import { Readability } from '@mozilla/readability';

const CORS_PROXY = "https://api.codetabs.com/v1/proxy?quest="

export async function getArticleContent(url) {
    try {
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const reader = new Readability(doc);
        const article = reader.parse();

        if (!article) {
            return {
                title: null,
                content: "Error fetching article content!"
            }
        }

        return {
            title: article.title,
            content: article.textContent,
            excerpt: article.excerpt,
        };
    } catch (error) {
        console.error('Error fetching article:', error);
        return {
            title: null,
            content: "Error fetching article content!"
        }
    }
}