import { Readability } from '@mozilla/readability';
import { checkFakeNews } from './fakeNews';
import { GoogleGenerativeAI } from '@google/generative-ai'


function createNewsVeracityPill() {
    const pill = document.createElement('div');
    pill.id = 'news-veracity-pill';
    pill.style = `
        position: fixed;
        top: 60px;
        right: 40px;
        z-index: 10000;
        background-color: #f0f0f0;
        padding: 10px 20px;
        border-radius: 20px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        font-size: 16px;
        font-weight: 500;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
    `;

    pill.addEventListener('mouseenter', () => {
        pill.style.transform = 'translateY(-2px)';
        pill.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
    });
    
    pill.addEventListener('mouseleave', () => {
        pill.style.transform = 'translateY(0)';
        pill.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    });

    return pill;
}

function updatePillContent(pill, isLoading, response) {
    
    if (isLoading) {
        pill.innerHTML = `
            <span style="
                display: inline-block;
                width: 12px;
                height: 12px;
                border: 2px solid #666;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s linear infinite;
                margin-right: 6px;
            "></span>
            <span>Analyzing article...</span>
        `;
        return;
    }

    if (!response) {
        pill.innerHTML = '<span>Error analyzing article</span>';
        return;
    }

    const pillText = response.veracity || 'Unknown';
    pill.style.backgroundColor = 
        response.veracity === 'Real News' ? '#52c41a' :
        response.veracity === 'Fake News' ? '#ff4d4f' : '#faad14';
    pill.style.color = '#fff';

    const tooltip = document.createElement('div');
    tooltip.style = `
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: white;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        width: 360px;
        max-height: 500px;
        display: none;
        z-index: 10001;
        font-size: 14px;
        color: #333;
        overflow-y: auto;
        overflow-x: hidden;
        cursor: default;
    `;

    pill.innerHTML = `<span>${pillText}</span>`;

    if (!isLoading && response) {
        tooltip.innerHTML = `
            <div style="margin-bottom: 8px; line-height: 1.6;">
                <strong>Analysis:</strong> ${response.reasoning}
            </div>
        `;

        pill.appendChild(tooltip);

        pill.addEventListener('click', (e) => {
            tooltip.style.display = tooltip.style.display === 'none' ? 'block' : 'none';
            e.stopPropagation();
        });

        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('click', () => {
            tooltip.style.display = 'none';
        });
    }
}

function isArticlePage() {
    const article = new Readability(document.cloneNode(true)).parse();
    return article && article.textContent.length > 400;
}

async function main() {
    try {
        if (!isArticlePage()) return;
        
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
        
        const article = new Readability(document.cloneNode(true)).parse();
        if (!article) return;

        const pill = createNewsVeracityPill();
        document.body.appendChild(pill);
        updatePillContent(pill, true);

        const res = await checkFakeNews(article.textContent);
        updatePillContent(pill, false, res);

    } catch (error) {
        console.error('Error in article analysis:', error);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

export { isArticlePage };