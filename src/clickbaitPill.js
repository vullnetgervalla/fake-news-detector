import { checkFakeNews } from './fakeNews.js';

export const createLoadingPill = () => {
    const pill = document.createElement('div');
    pill.id = 'clickbait-pill';
    pill.style = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 3000;
        background-color: #f0f0f0;
        padding: 6px 12px;
        border-radius: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        font-size: 14px;
        font-weight: 500;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 26px;
    `;
    return pill;
};

export const updatePillContent = (pill, isLoading, clickbaitResponse, article) => {
    if (!clickbaitResponse || !clickbaitResponse.hasOwnProperty('clickbait')) {
        pill.innerHTML = '<span>Error</span>';
    }
    const pillText = clickbaitResponse?.clickbait
        ? 'Clickbait'
        : clickbaitResponse?.clickbait === false
            ? 'Not Clickbait'
            : 'Unknown';

    pill.style.backgroundColor = clickbaitResponse?.clickbait ? '#ff4d4f' : clickbaitResponse?.clickbait === false ? '#52c41a' : '#f0f0f0';
    pill.style.color = clickbaitResponse?.clickbait ? '#fff' : clickbaitResponse?.clickbait === false ? '#fff' : '#666';

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
        width: 280px;
        display: none;
        z-index: 9000;
        font-size: 12px;
        color: #333;
        max-height: 270px;
        overflow-y: auto;
        overflow-x: hidden;
        cursor: default;
    `;

    pill.innerHTML = isLoading ? `
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
        <span>Analyzing...</span>
    ` : `
        <span>${pillText}</span>
    `;

    if (!isLoading && clickbaitResponse) {
        tooltip.innerHTML = `
            <div style="
                margin-bottom: 6px;
                line-height: 1.4;
            ">
                <strong style="font-weight: bold;">Reason:</strong> ${clickbaitResponse.reason}
            </div>
            ${clickbaitResponse.summary ? `
            <div style="line-height: 1.4; margin-bottom: 10px;">
                <strong style="font-weight: bold;">Summary:</strong> ${clickbaitResponse.summary}
            </div>` : ''}
            <div id="FakeNewsDiv">
                <button id="check-fake-news" style="
                    background: #1890ff;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 8px;
                ">Check for Fake News</button>
            </div>
        `;

        pill.appendChild(tooltip);
        pill.style.cursor = 'pointer';

        const checkButton = tooltip.querySelector('#check-fake-news');
        if (checkButton) {
            checkButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                checkButton.disabled = true;
                checkButton.textContent = 'Checking...';
                const fakeNewsResponse = await checkFakeNews(article.content);
                updateFakeNewsTooltip(tooltip, fakeNewsResponse);
            });
        }

        pill.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = tooltip.style.display === 'block';
            tooltip.style.display = isVisible ? 'none' : 'block';
        });

        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('click', () => {
            tooltip.style.display = 'none';
        });
    }
};

function updateFakeNewsTooltip(tooltip, fakeNewsResponse) {
    const fakeNewsDiv = tooltip.querySelector('#FakeNewsDiv');
    if (fakeNewsResponse) {
        fakeNewsDiv.innerHTML = `
            <div style="
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #eee;
            ">
                <div style="
                    font-weight: bold;
                    line-height: 1.6;
                    color: ${
                        fakeNewsResponse.veracity === "Fake News" ? "#ff4d4f" :
                        fakeNewsResponse.veracity === "Real News" ? "#52c41a" : "#faad14"
                    };
                    text-align: center;
                    font-size: 18px;
                    padding: 8px 0;
                    margin-bottom: 10px;
                    border-radius: 6px;
                    background-color: ${
                        fakeNewsResponse.veracity === "Fake News" ? "#fff2f0" :
                        fakeNewsResponse.veracity === "Real News" ? "#f6ffed" : "#fff7e6"
                    };
                ">${fakeNewsResponse.veracity}</div>
                <div style="margin-top: 8px; line-height: 1.5;">${fakeNewsResponse.reasoning}</div>
                ${fakeNewsResponse.sources ? `
                <div style="margin-top: 12px;">
                    <strong>Sources:</strong>
                    <ol style="margin: 6px 0 0 20px; padding: 0; line-height: 1.5;">
                        ${fakeNewsResponse.sources.map(source => `<li><a href="${source}" target="_blank">${source}</a></li>`).join('')}
                    </ol>
                </div>
                ` : ''}
            </div>
        `;
    }
}

export const addSpinAnimation = () => {
    if (!document.querySelector('#spin-animation')) {
        const style = document.createElement('style');
        style.id = 'spin-animation';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
};