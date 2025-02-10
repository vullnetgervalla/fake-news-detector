import { GoogleGenerativeAI } from '@google/generative-ai'
import { addSpinAnimation, createLoadingPill } from './clickbaitPill';
import { isClickbait } from './clickbait';

const allPosts = [];
const seenPosts = new Set();

const getPosts = function(model) {
    const posts = document.querySelectorAll('.html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1n2onr6');
    
    addSpinAnimation();

    posts.forEach(post => {
        const a = post.querySelector('div[data-ad-rendering-role="image"] > a');
        const span = post.querySelector('span[data-ad-rendering-role="title"] > span');
        
        if (a && span) {
            const href = a.getAttribute('href');
            const text = span.textContent;
            
            if (href.startsWith("https://") && !seenPosts.has(href) && !post.querySelector("#clickbait-pill")) {
                const img = post.querySelector('div[data-ad-rendering-role="image"]');
                const pill = createLoadingPill();
                img.appendChild(pill);
                isClickbait(pill, text, href);
                seenPosts.add(href);
                allPosts.push({ post, href, text });
            }
        }
    });
};

async function main() {
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "getApiKey" }, resolve);
        });

        if (!response?.apiKey) {
            console.error('API key not found in storage');
            return;
        }

        const genAI = new GoogleGenerativeAI(response.apiKey);
        const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});
        window.currentModel = model;

        setInterval(() => {
            getPosts(model);
        }, 1000);
    } catch (error) {
        console.error('Error initializing:', error);
    }
}

main();