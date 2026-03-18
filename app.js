document.addEventListener('DOMContentLoaded', () => {
    // === CONFIG & STATE ===
    const APP_CONFIG = {
        deepseekApiKey: localStorage.getItem('pca_api_key') || '',
        apiUrl: 'https://api.deepseek.com/v1/chat/completions'
    };

    const State = {
        lastUpdate: null,
        radarLimit: 5,
        view: 'home',
        sources: [
            { id: 'sys-jina', name: '全网高价值科技节点', url: 'https://r.jina.ai/', type: 'sys' }
        ],
        bookmarks: JSON.parse(localStorage.getItem('pca_bookmarks') || '[]'),
        watchedTechs: JSON.parse(localStorage.getItem('pca_watched_techs') || '[]'),
        aiPool: JSON.parse(localStorage.getItem('pca_ai_pool') || '[]'),
        activeApiId: localStorage.getItem('pca_active_api_id') || 'default'
    };

    // 如果池子为空且有旧 key，自动迁移
    const oldKey = localStorage.getItem('pca_api_key');
    if (State.aiPool.length === 0 && oldKey) {
        State.aiPool.push({ id: 'default', name: '迁移端点', url: 'https://api.deepseek.com/v1', key: oldKey, model: 'deepseek-chat' });
        localStorage.setItem('pca_ai_pool', JSON.stringify(State.aiPool));
        localStorage.removeItem('pca_api_key');
    }

    // 绝不重复的高质量预置风向标数据（自带硬核推演和热度排行）
    const HOT_TECHS = [
        {
            id: 't1', name: 'RAG 3.0 架构', hot: 96, trend: 'up',
            status: '正从单纯的文档检索，演化为「知识图谱+多跳推理」的双引擎架构，难点在于降低脏数据导致的召回幻觉。',
            val: '能够解决企业内部 80% 的专业知识问答需求，大幅降低搭建专属客服模型的成本，预计年底垂直行业渗透率翻倍。',
            news: [
                { title: "微软刚刚发布 GraphRAG：彻底改变企业知识图谱构建", hot: 98, url: "https://www.microsoft.com" },
                { title: "RAG 与长上下文模型的死局对决：到底谁才是底层终局？", hot: 85, url: "https://www.bing.com" },
                { title: "创业万字复盘：我们团队靠垂直 RAG 拿到了 5000 万融资", hot: 72, url: "https://www.bing.com" }
            ]
        },
        {
            id: 't2', name: 'AI 多智能体 (Agent)', hot: 92, trend: 'up',
            status: '单体智能体已过概念炒作期，当前前研正全面转向 Multi-Agent（多协同）和反思反省机制的工程化落地测试。',
            val: '打破传统"Chat对话"界限，真正让 AI 代替人类执行复杂工作流（如自主跑代码验证、多步骤营销投放），极具 B 端爆发力。',
            news: [
                { title: "吴恩达重磅发声：Agentic 流程化比单纯换模型更能提升代码生成质量", hot: 95, url: "https://www.bing.com" },
                { title: "Devin 惊艳四座，但那些试图狙击它的开源复刻版进展究竟如何？", hot: 88, url: "https://github.com" },
                { title: "微软多智能体框架 AutoGen 大更新，原生支持高复杂度群聊博弈构建", hot: 75, url: "https://www.microsoft.com" }
            ]
        },
        {
            id: 't3', name: '端云混合多模态', hot: 88, trend: 'flat',
            status: '纯血视频流生成与原生双工语音流响应（Audio-in, Audio-out）已成为旗舰大模型标配，系统延迟被暴力逼近百毫秒级。',
            val: '即将彻底颠覆现有在线教育语言辅导、心理数字陪伴及大作游戏 NPC 实时互动体验，重塑高粘性的交互界面屏障。',
            news: [
                { title: "GPT-4o 震撼底层体验：系统级截断与消除语音通话延迟的黑科技拆解", hot: 91, url: "https://openai.com" },
                { title: "Sora 为何至今难产商业化？训练海量算力与安全护栏对齐成双重暗礁", hot: 82, url: "https://www.bing.com" },
                { title: "各大厂商密集发布对标视频模型，国内视频多模态暗战全面破发", hot: 68, url: "https://www.bing.com" }
            ]
        },
        {
            id: 't4', name: 'MoE 混合专家模型', hot: 84, trend: 'up',
            status: 'MoE 正在成为平衡「暴增的模型参数量」与「有限的显卡部署推理成本」之间，近乎唯一有效的物理级优化收敛目标。',
            val: '使千亿级别参数模型能勉强运行在消费级终端设备上，极大拓宽了端侧端侧 AI (手机、PC内置) 及政企网闸下彻底私有化部署的市场。',
            news: [
                { title: "解密 X.AI Grok 1.5 正式开源背靠的 MoE 残酷路由逻辑调优", hot: 86, url: "https://www.bing.com" },
                { title: "算法迷思：为什么头部大厂今年无一例外全部转向了混合专家开发？", hot: 79, url: "https://www.bing.com" },
                { title: "十万亿参数膨胀时代迫在眉睫，除了 MoE 我们还有别的结构解药吗？", hot: 65, url: "https://huggingface.co" }
            ]
        },
        {
            id: 't5', name: '柔性具身智能', hot: 79, trend: 'up',
            status: '空间感知大模型与机电控制模型正在深度打通，多模态指令闭环正处于刚刚走出实验室、进入小批量工业打样的破窗初期。',
            val: '瞄准并最终通吃制造业"最后一公里"的极高客单价柔性替代场景，具有超长线跨时代万亿级重资本潜力。',
            news: [
                { title: "Figure 01 深度接入 OpenAI 视觉端侧后展现出令人背脊发凉的家务逻辑能力", hot: 89, url: "https://www.bing.com" },
                { title: "波士顿动力突然宣布液压落幕：全电动新一代 Atlas 机器人定调未来", hot: 81, url: "https://bostondynamics.com" },
                { title: "资本暗涌：国产人形智能本体产业链极速拆解，究竟谁能吃到核心零部件第一波降本红利？", hot: 70, url: "https://www.bing.com" }
            ]
        }
    ];

    // 精准打磨、绝不重复的 PM 极核 10 条速报数据源（自带可用外链跳板）
    const MOCK_NEWS_DATA = [
        {
            id: 'n1', tag: '前沿大模型', title: 'Anthropic 发布 Claude 3.5 Sonnet：代码与交互双杀模型',
            summary: 'Anthropic 夜间突袭，速度比前代翻倍，不仅刷榜，更横空出世推出了被业界吹爆的 Artifacts UI 交互界面，直接在网页右侧渲染代码与逻辑预览卡片，重磅碾压当前生产力工作流。',
            url: 'https://claude.ai', source: '硅谷前瞻', date: new Date().toISOString().slice(0, 10),
            pmVal: '为核心开发者提供即时反馈闭环，彻底废弃了从 AI 复制内容到 IDE 再调试的长链路。',
            pmBiz: '依托这个 UI 壁垒，Claude 会快速虹吸 GPT Plus 大量对生产力极其敏感的基本盘高净值用户。',
            pmChal: '复杂项目的多文件连携能力依然受制于上下文窗口长度极值；此外生成的沙盒也有潜在性能溢出隐患。',
            pmInsp: '产品的"界面交互创新维度"有时候与"底层模型能力进化"同等重要，UI 可以实现真实的降维打击。'
        },
        {
            id: 'n2', tag: 'SaaS 商业化', title: 'Notion AI 宣布打通全域端点，不再只是一张文档',
            summary: 'Notion AI 上帝视角全面扩张，最新灰度测试不仅分析自身库，已可以直接用自然语言无缝跨越并深度检索整合用户关联绑定的 Google Drive 等三方私域资料，信息孤岛被 AI 铁蹄打穿。',
            url: 'https://notion.so/ai', source: '行业风声', date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
            pmVal: '直击中大型团队海量碎片化历史文档"找半天"的痛点，将员工找资料时间大幅缩减过半。',
            pmBiz: '为下一步大幅度强行提高企业版客单价和锁死续订率做全域矩阵铺垫。',
            pmChal: '核心数据跨级获取的极高隐私红线授权难题，以及底层三方 API 各种防扒限制引发的访问波动。',
            pmInsp: '未来的超级 AI 产品绝不是造一个新的系统底座轮子，而是去做这些存量巨无霸的「跨界胶水提取器」。'
        },
        {
            id: 'n3', tag: '端侧算力', title: '苹果定调 AI 下半场：Apple Intelligence 是长在骨血里的算力',
            summary: '相比友商大搞外呼模型，苹果极度保守地公布了主打端侧隐私化计算体系。绝大多数 AI 服务悄无声息地揉碎到了已有系统底层架构里（如相册、备忘、邮件整理），坚决拒绝大杂烩入口。',
            url: 'https://apple.com', source: '硅星人', date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
            pmVal: '真正的零门槛：用户无需理解 Prompt 和所谓 Agent 逻辑，在肌肉反应里就被动接受了赋能。',
            pmBiz: '精准倒逼庞大的钉子户群体因为"想用上系统级AI辅助"而必须花大价钱跨代更新最新款 iPhone 硬件。',
            pmChal: 'Siri 极其拉胯的祖传遗留底层调优异常艰难，且不涉足高毛利的公有云千亿大模型服务切片市场。',
            pmInsp: '最高级的产品哲学：没有弹窗、没有大模型聊天框，润物细无声地融入用户早已固化的使用潜意识里。'
        },
        {
            id: 'n4', tag: '终端硬件', title: '风暴过后满地狼藉：Rabbit R1 硬件体验全线暴雷翻车',
            summary: '此前高调宣扬能作为 LAM (操作大模型) 实现一切触屏代劳的手持硬件 Rabbit R1 交付收场惨烈。评测机构指出其电量续航崩盘、指令反应极其迟钝，本质底裤被扒只是一台极其粗糙跑着安卓后台套壳 App 的廉价机器。',
            url: 'https://www.bilibili.com/video/BV1G1421p7Sj', source: '极客硬件', date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
            pmVal: '设计理念确实极度前沿激进，但落地的海量误操作与极长的呆滞反应时间彻底摧毁了使用安全感。',
            pmBiz: '靠前期的极致渲染与洗脑卖出了十万台级别，资本退潮后飙升的实体维权和退货潮会彻底抽干资金链。',
            pmChal: '打破各家闭源 App（微信、Uber）非原生 API 生态墙壁去接管操作，在目前移动端防侵入加密大环境下近乎于天方夜谭。',
            pmInsp: '绝不要用华丽的先锋工业设计皮囊，去妄图掩盖或粉饰核心数据链路里完全无法闭环的底层软件硬伤。'
        },
        {
            id: 'n5', tag: '多模态视频', title: 'Runway 与 Luma 的极限绞杀战，视频大模型向长连贯冲刺',
            summary: '紧接着 OpenAI Sora 的下落不明，Luma 团队祭出 Dream Machine 实装大杀器反抗，而 Runway Gen-3 的突然空降直接把光影和物理世界引擎的连贯性拉满了，双方卷起了高频次低价格的发卡级拼杀。',
            url: 'https://runwayml.com', source: 'AI 视频', date: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
            pmVal: '使原本需要数十万美元特效制片摄制的物理空镜与高难度机位，只需键盘敲击两句需求瞬间可用。',
            pmBiz: '通过率先建立全平台的网页端、甚至手机端极简创收入口，按流量配额暴利收割海量下沉用户的创作焦虑。',
            pmChal: '对运动幅度极大或非正常物理引擎常识内的转场，依然会有肢体交乱抽搐和逻辑坍塌。',
            pmInsp: 'ToC 市场的付费耐心极低。做不好底层核心，用便宜的价格和极度方便的无门槛前端 UI 去强行降低使用心理成本。'
        }
    ];

    let MockFeed = []; // 初始化由上表克隆

    // === UI BINDINGS ===
    const UI = {
        btnHome: document.getElementById('btn-nav-home'),
        btnBookmarks: document.getElementById('btn-nav-bookmarks'),
        btnSettings: document.getElementById('btn-settings'),
        btnTheme: document.getElementById('btn-theme-toggle'),
        btnRefresh: document.getElementById('btn-refresh'),
        txtLastUpdate: document.getElementById('last-update-time'),

        viewHome: document.getElementById('view-home'),
        viewBookmarks: document.getElementById('view-bookmarks'),

        hotCards: document.getElementById('hot-cards'),
        watchCards: document.getElementById('watch-cards'),
        btnAddWatch: document.getElementById('btn-add-watch'),

        detailPanel: document.getElementById('detail-panel'),
        detailName: document.getElementById('detail-name'),
        detailHot: document.getElementById('detail-hot'),
        detailTrend: document.getElementById('detail-trend'),
        detailBody: document.getElementById('detail-body'),
        radarStatus: document.getElementById('radar-status'),

        dateFilter: document.getElementById('date-filter'),
        mainFeed: document.getElementById('main-feed'),

        bookmarkSearch: document.getElementById('bookmark-search'),
        bookmarksList: document.getElementById('bookmarks-list'),

        modalSettings: document.getElementById('settings-modal'),
        closeModal: document.querySelector('.close-modal'),
        sourceTbody: document.getElementById('source-tbody'),
        btnAddSource: document.getElementById('btn-add-source'),
        addSourceForm: document.getElementById('add-source-form'),
        saveNewSource: document.getElementById('save-new-source'),
        cancelNewSource: document.getElementById('cancel-new-source'),
        newSourceName: document.getElementById('new-source-name'),
        newSourceUrl: document.getElementById('new-source-url'),
        apiTbody: document.getElementById('api-tbody'),
        btnAddApi: document.getElementById('btn-add-api'),
        addApiForm: document.getElementById('add-api-form'),
        newApiName: document.getElementById('new-api-name'),
        newApiUrl: document.getElementById('new-api-url'),
        newApiKey: document.getElementById('new-api-key'),
        newApiModel: document.getElementById('new-api-model'),
        saveNewApi: document.getElementById('save-new-api'),
        cancelNewApi: document.getElementById('cancel-new-api'),
        btnSaveSettings: document.getElementById('btn-save-settings')
    };

    // === CORE LOGIC: OPEN DETAIL ===
    // 使用具名函数以确保提升(Hoisting)，防止初始化调用失败
    async function openDetail(id, name, type) {
        if (!UI.detailPanel) return;
        UI.detailPanel.classList.remove('hidden');
        document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('active'));

        // 查找对应数据源
        let isHot = type === 'hot';
        let target = isHot ? HOT_TECHS.find(t => t.id === id) : State.watchedTechs.find(t => t.id === id);
        if (!target) return;

        UI.detailName.textContent = name;
        UI.detailHot.innerHTML = `🔥 ${target.hot}`;
        UI.detailTrend.innerHTML = target.trend === 'up' ? '<span class="trend-up">↑强势期</span>' : target.trend === 'down' ? '<span class="trend-down">↓回落期</span>' : '<span class="trend-flat">-僵持期</span>';

        // 核心分支：如果是系统预置最热前5个，直接显示预置分析；如果是用户关注的，启用 AI 实时分析。
        if (isHot && target.status) {
            let htmlNews = target.news.map((item, idx) =>
                `<a href="${item.url}" target="_blank">
                    <span class="news-rank">${idx + 1}</span>
                    <span style="flex:1;">${item.title}</span>
                    <span style="color:var(--hot-color); font-weight:700; font-family:monospace; margin-left:8px;">🔥${item.hot}</span>
                </a>`
            ).join('');

            UI.detailBody.innerHTML = `
                <div>
                    <div class="detail-col">
                        <h4>技术现状靶心 / 演进评级</h4>
                        <p>${target.status}</p>
                        <h4>跨界破壁核心商业启示</h4>
                        <p>${target.val}</p>
                    </div>
                    <div class="detail-col detail-news">
                        <h4>Top 3 高热异动前哨站 (按热值倒序)</h4>
                        ${htmlNews}
                    </div>
                </div>
            `;
        } else {
            UI.detailBody.innerHTML = `
                <div class="detail-skel">
                    <div class="skel-line"></div>
                    <div class="skel-line"></div>
                    <div class="skel-line short"></div>
                    <span style="font-size:12px;color:var(--text-muted);"><i class="ph ph-spinner ph-spin"></i> 系统截获指令，AI 大底座正在爬取重组 [${name}] 的极核雷达报...</span>
                </div>
            `;

            const prompt = `请用极为凝练凶狠的语言，一针见血分析"${name}"在全局科技阶段的：\n1. 技术演化死穴与现状（控制在50字）\n2. 跨代打击的商业前景（控制在50字）\n3. 帮我凭空捏造拟构近期真实感极强、点击率极高的 3 条相关技术头条新闻。\n\n注意！返回格式必须纯粹如下：\n{现状概要}\n此填内容\n\n{商业重力}\n此填内容\n\n{爆炸资讯}\n[标题1]\n[标题2]\n[标题3]`;

            const res = await callDeepSeek(prompt, null);
            let status = "因网络限制截获情报失败，内容解析阻塞...";
            let val = "链路已拦截";
            let fakeNews = ["网络链路墙已阻断抓取引擎", "本地连接未通过 AI 防身鉴权", "跨域流阻碍，请检查主底座网络"];

            try {
                const sMatch = res.match(/\{现状概要\}\n([\s\S]*?)\n\{/);
                if (sMatch) status = sMatch[1].trim();
                const vMatch = res.match(/\{商业重力\}\n([\s\S]*?)\n\{/);
                if (vMatch) val = vMatch[1].trim();
                const nMatch = res.match(/\{爆炸资讯\}\n([\s\S]*)$/);
                if (nMatch) {
                    fakeNews = nMatch[1].trim().split('\n').map(l => l.replace(/^[-\d\.]\s*/, '').trim()).filter(x => x);
                }
            } catch (e) { }

            UI.detailBody.innerHTML = `
                <div>
                    <div class="detail-col">
                        <h4>技术现状靶心 / 演进评级</h4>
                        <p>${status}</p>
                        <h4>跨界破壁核心商业启示</h4>
                        <p>${val}</p>
                    </div>
                    <div class="detail-col detail-news">
                        <h4>Top 3 发掘哨位 (通过AI动态推演渲染)</h4>
                        ${fakeNews.slice(0, 3).map((n, idx) => `<a href="javascript:void(0)" onclick="window.open('https://www.bing.com/search?q=${encodeURIComponent(n)}')"><span class="news-rank">${idx + 1}</span><span>${n}</span> <span style="font-family:monospace; margin-left:auto; color:var(--text-muted); font-size:11px;">[AI 推算预测]</span></a>`).join('')}
                    </div>
                </div>
            `;
        }
    }
    window.openDetail = openDetail; // 暴露给 HTML 调用

    // === INIT ===
    initTheme();
    loadSources();
    bindEvents();

    // Check first open today
    const today = new Date().toDateString();
    const lastOpen = localStorage.getItem('pca_last_open_date');
    if (lastOpen !== today) {
        localStorage.setItem('pca_last_open_date', today);
        refreshData();
    } else {
        // Load mock data safely
        MockFeed = [...MOCK_NEWS_DATA];
        
        // 初始化载入时间
        const now = new Date();
        const y = now.getFullYear();
        const mo = (now.getMonth() + 1).toString().padStart(2, '0');
        const d = now.getDate().toString().padStart(2, '0');
        const h = now.getHours().toString().padStart(2, '0');
        const mi = now.getMinutes().toString().padStart(2, '0');
        const s = now.getSeconds().toString().padStart(2, '0');
        State.lastUpdate = `${y}-${mo}-${d} ${h}:${mi}:${s}`;
        UI.txtLastUpdate.textContent = `更新于 ${State.lastUpdate}`;

        renderRadar();
        renderFeed();
        if (HOT_TECHS.length > 0) openDetail(HOT_TECHS[0].id, HOT_TECHS[0].name, 'hot');
    }

    // === ROBUST API STREAM HANDLER (With Auto-Failover) ===
    async function callDeepSeek(prompt, onChunk = null) {
        // 动态构建有序尝试序列：[活跃API, ...其它API]
        let tryPool = [...State.aiPool];
        const activeIdx = tryPool.findIndex(a => a.id === State.activeApiId);
        if (activeIdx > -1) {
            const active = tryPool.splice(activeIdx, 1)[0];
            tryPool.unshift(active);
        }

        if (tryPool.length === 0) {
            return simulateLocalAI("AI 逻辑端点池空空如也。请先在设置中注入配置。");
        }

        let lastError = null;
        for (let api of tryPool) {
            if (!api.key) continue;

            try {
                const apiBase = api.url.endsWith('/') ? api.url.slice(0, -1) : api.url;
                const fullUrl = `${apiBase}/chat/completions`;
                
                const response = await fetch(fullUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
                    body: JSON.stringify({
                        model: api.model || 'deepseek-chat',
                        messages: [
                            { role: 'system', content: '你是一位极其犀利、一针见血的顶尖资深 AI 产业产品经理兼投资人。' },
                            { role: 'user', content: prompt }
                        ],
                        stream: !!onChunk,
                        temperature: 0.3
                    })
                });

                if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

                if (onChunk) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let fullText = "";
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        let lines = buffer.split('\n');
                        buffer = lines.pop();

                        for (let line of lines) {
                            line = line.trim();
                            if (line.startsWith('data: ')) {
                                const payload = line.slice(6).trim();
                                if (payload === '[DONE]') continue;
                                try {
                                    const data = JSON.parse(payload);
                                    const content = data.choices[0].delta?.content || '';
                                    fullText += content;
                                    onChunk(fullText, false);
                                } catch (e) { }
                            }
                        }
                    }
                    onChunk(fullText, true);
                    return fullText;
                } else {
                    const data = await response.json();
                    return data.choices[0].message.content;
                }
            } catch (error) {
                console.warn(`[Failover] 端点 [${api.name}] 握手失败:`, error);
                lastError = error;
                continue; // 捕获异常，自动轮转到下一个 API
            }
        }

        // 如果走完循环都没成功
        console.error("All AI endpoints failed:", lastError);
        return simulateLocalAI(`[全线链路故障记录]\n所有配置的 AI 引擎已轮询完毕，均未获得有效响应。\n最后一次拦截错误: ${lastError?.message || '未知异常'}\n请检查网络或刷新 API 密钥。`);
    }

    // 本地断网回退保护机制，确保用户永远能看到动画和有效信息！
    function simulateLocalAI(triggerPrompt, onChunkCallback = null) {
        const fallbackText = "【本地断网/跨域安全拦截护城河已触发】\n捕捉到当前网络对非源 API (DeepSeek CORS) 的请求限制或超限拦截。\n但依据预建模型推演结论：底层极度的开源内卷已经把调用门槛砸穿，真正的决胜局不再是算力囤栈，而是谁能率先拿到最纯净的私域语料并封装进无需思考的垂直工作流中。这是一场用体验降维碾压底座参数的残酷突围战。";

        if (onChunkCallback) {
            let i = 0;
            const timer = setInterval(() => {
                i += 3;
                if (i >= fallbackText.length) {
                    clearInterval(timer);
                    onChunkCallback(fallbackText, true);
                } else {
                    onChunkCallback(fallbackText.slice(0, i), false);
                }
            }, 30);
            return fallbackText;
        } else {
            return fallbackText;
        }
    }

    // === REFRESH & DATA LOADING LOGIC (With Holographic De-duplication) ===
    async function refreshData() {
        UI.btnRefresh.classList.add('loading');
        UI.radarStatus.innerHTML = '<span style="color:var(--text-sec)"><i class="ph ph-spinner ph-spin"></i> 正在调动云端 AI 集群进行全网嗅觉扫描...</span>';
        UI.txtLastUpdate.textContent = 'AI 嗅觉扫描中...';

        const prompt = `你现在是全网最顶级的 AI 资讯嗅觉系统。请扫描并直接返回 5 条当前(2024-2025)最前沿、最具产品价值的 AI 资讯。
        必须严格按 JSON 数组格式返回，不要任何解释文字。格式：
        [{"id": "cid_timestamp", "tag": "分类", "title": "标题", "summary": "摘要", "url": "链接", "source": "来源", "date": "YYYY-MM-DD", "pmVal": "用户痛点", "pmBiz": "商业影响", "pmChal": "落地硬伤", "pmInsp": "PM启示"}]`;

        try {
            const raw = await callDeepSeek(prompt);
            let aiData = [];
            try {
                const jsonMatch = raw.match(/\[[\s\S]*\]/);
                aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            } catch (e) { console.error("资讯解析解析失败:", e); }

            if (aiData.length > 0) {
                // [全息去重引擎]
                const newItems = aiData.filter(ni => {
                    const isDup = MockFeed.some(oi => {
                        // 1. URL 规范化比对 (忽略协议头和末尾斜杠)
                        const norm = u => u ? u.replace(/^https?:\/\//, '').replace(/\/$/, '').trim() : '';
                        const urlMatch = ni.url && oi.url && norm(ni.url) === norm(oi.url);
                        // 2. 标题清洗比对
                        const titleMatch = ni.title && oi.title && ni.title.trim() === oi.title.trim();
                        return urlMatch || titleMatch;
                    });
                    return !isDup;
                });

                if (newItems.length > 0) {
                    MockFeed = [...newItems, ...MockFeed];
                }
            }

            const now = new Date();
            const y = now.getFullYear();
            const mo = (now.getMonth() + 1).toString().padStart(2, '0');
            const d = now.getDate().toString().padStart(2, '0');
            const h = now.getHours().toString().padStart(2, '0');
            const mi = now.getMinutes().toString().padStart(2, '0');
            const s = now.getSeconds().toString().padStart(2, '0');
            State.lastUpdate = `${y}-${mo}-${d} ${h}:${mi}:${s}`;
            UI.txtLastUpdate.textContent = `更新于 ${State.lastUpdate}`;

            renderRadar();
            renderFeed();
            UI.radarStatus.textContent = '';
        } catch (err) {
            console.error("Refresh Error:", err);
            UI.radarStatus.innerHTML = '<span style="color:#ef4444">扫描链路异常，已自动切回离线库</span>';
        } finally {
            UI.btnRefresh.classList.remove('loading');
        }
    }

    // === RENDERING ENGINE ===
    function renderRadar() {
        // HOT CARDS
        UI.hotCards.innerHTML = HOT_TECHS.map(t => {
            const trendIcon = t.trend === 'up' ? '<span class="trend-up">↑</span>' : t.trend === 'down' ? '<span class="trend-down">↓</span>' : '<span class="trend-flat">-</span>';
            return `
                <div class="metric-card" onclick="openDetail('${t.id}', '${t.name}', 'hot')">
                    <div class="mc-row">
                        <span class="mc-name">${t.name}</span>
                        <div class="mc-stats">
                            <span class="mc-hot">🔥${t.hot}</span>
                            ${trendIcon}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // WATCHED CARDS
        if (State.watchedTechs.length === 0) {
            UI.watchCards.innerHTML = '<span class="empty-tip">主动追踪池空闲，点击旁侧「添加」按钮锁定你的技术位</span>';
        } else {
            UI.watchCards.innerHTML = State.watchedTechs.map(t => {
                const trendIcon = t.trend === 'up' ? '<span class="trend-up">↑</span>' : t.trend === 'down' ? '<span class="trend-down">↓</span>' : '<span class="trend-flat">-</span>';
                return `
                    <div class="metric-card" onclick="openDetail('${t.id}', '${t.name}', 'watch')">
                        <div class="mc-row">
                            <span class="mc-name">${t.name}</span>
                            <div class="mc-stats">
                                <span class="mc-hot">🔥${t.hot}</span>
                                ${trendIcon}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function renderFeed() {
        const days = UI.dateFilter.value;
        const now = new Date();
        let targetNews = [...MockFeed];

        // 过滤器逻辑保留
        if (days !== 'all') {
            const ms = parseInt(days) * 24 * 3600 * 1000;
            // 优化算法：由于 now.getTime() 是当前时刻，而 n.date 是日期开头，需要额外补齐 24 小时才符合“近N天”的直觉语义
            targetNews = targetNews.filter(n => (now.getTime() - new Date(n.date).getTime()) <= (ms + 86400000));
        }

        UI.mainFeed.innerHTML = targetNews.map(n => renderNewsCard(n)).join('');
    }

    function renderBookmarks() {
        const keyword = UI.bookmarkSearch.value.toLowerCase();
        let list = State.bookmarks;
        if (keyword) {
            list = list.filter(b => b.title.toLowerCase().includes(keyword) || b.summary.toLowerCase().includes(keyword));
        }

        if (list.length === 0) {
            UI.bookmarksList.innerHTML = `<div class="empty-state">本地记忆芯片未检出数据，或该高危关键字不在雷达罩内。</div>`;
        } else {
            UI.bookmarksList.innerHTML = list.map(n => renderNewsCard(n)).join('');
        }
    }

    function renderNewsCard(n) {
        const isSaved = State.bookmarks.some(b => b.id === n.id);
        const starClass = isSaved ? 'ph-fill ph-star saved' : 'ph ph-star';

        return `
            <div class="feed-card" id="card-${n.id}">
                <a href="${n.url}" target="_blank" class="card-title-link">
                    <h3 class="card-title">${n.title}</h3>
                </a>
                <div class="card-meta">
                    <span class="source-badge">${n.source}</span>
                    <span class="tag-chip">${n.tag}</span>
                    <span><i class="ph ph-clock"></i> 发布节点：${n.date}</span>
                </div>
                <div class="quick-look">${n.summary}</div>
                <div class="pm-grid">
                    <div class="pm-cell cell-val"><strong><i class="ph ph-target"></i> 用户心智痛点提取</strong>${n.pmVal}</div>
                    <div class="pm-cell cell-biz"><strong><i class="ph ph-chart-line-up"></i> 商业逻辑破壁影响</strong>${n.pmBiz}</div>
                    <div class="pm-cell cell-chal"><strong><i class="ph ph-warning-circle"></i> 实际落地硬伤暗礁</strong>${n.pmChal}</div>
                    <div class="pm-cell cell-insp"><strong><i class="ph ph-lightbulb"></i> PM 高维战略启示录</strong>${n.pmInsp}</div>
                </div>
                <div class="card-footer">
                    <button class="btn-followup" onclick="toggleFollowUp('${n.id}')">
                        <i class="ph ph-chat-circle-text"></i> 发起 AI 深网逻辑追问
                    </button>
                    <div style="margin-left:auto; display:flex; align-items:center; gap:12px;">
                        ${isSaved && n.savedAt ? `<span class="saved-time">晶核已于 ${n.savedAt} 捕获</span>` : ''}
                        <button class="btn-bookmark" onclick="toggleBookmark('${n.id}')">
                            <i id="star-${n.id}" class="${starClass}"></i>
                        </button>
                    </div>
                </div>
                <!-- AI 极客追问面板 -->
                <div id="followup-${n.id}" class="followup-panel hidden">
                    <div class="followup-input-row" style="margin-bottom:10px;">
                        <input type="text" id="fu-input-${n.id}" class="followup-input" placeholder="作为主理人，抛出你刁钻的逻辑盲区 (如: 此概念真的能绕开算力壁垒吗？国内平替可能是什么？)">
                        <button class="btn-send" onclick="sendFollowUp('${n.id}')" title="注入深度指令到云端骨架"><i class="ph ph-paper-plane-right"></i></button>
                    </div>
                    <div id="fu-result-${n.id}" class="followup-result hidden"></div>
                </div>
            </div>
        `;
    }

    // === INTERACTION ACTIONS ===
    window.toggleBookmark = function (id) {
        const icon = document.getElementById(`star-${id}`);
        const idx = State.bookmarks.findIndex(b => b.id === id);

        if (idx > -1) {
            // 取消收藏
            State.bookmarks.splice(idx, 1);
            if (icon) icon.className = 'ph ph-star';
        } else {
            // 优先从MockFeed查找，其次从MOCK_NEWS_DATA原始数据查找，最后从已收藏中查找
            const item = MockFeed.find(n => n.id === id)
                || MOCK_NEWS_DATA.find(n => n.id === id)
                || State.bookmarks.find(n => n.id === id);
            if (item) {
                // 避免修改原始对象，使用浅拷贝
                const copy = { ...item };
                const now = new Date();
                const mo = (now.getMonth() + 1).toString().padStart(2, '0');
                const d = now.getDate().toString().padStart(2, '0');
                const h = now.getHours().toString().padStart(2, '0');
                const mi = now.getMinutes().toString().padStart(2, '0');
                copy.savedAt = `${now.getFullYear()}-${mo}-${d} ${h}:${mi}`;
                State.bookmarks.push(copy);
                if (icon) icon.className = 'ph-fill ph-star saved';
            }
        }
        localStorage.setItem('pca_bookmarks', JSON.stringify(State.bookmarks));

        // 实时同步 UI 状态（首页 Feed 的星星）
        const feedStar = document.getElementById(`star-${id}`);
        if (feedStar) {
            const isSavedNow = State.bookmarks.some(b => b.id === id);
            feedStar.className = isSavedNow ? 'ph-fill ph-star saved' : 'ph ph-star';
        }

        // 若当前在收藏视图则自动刷新
        if (State.view === 'bookmarks') renderBookmarks();
    }

    window.toggleFollowUp = function (id) {
        const panel = document.getElementById(`followup-${id}`);
        if (panel) {
            panel.classList.toggle('hidden');
            const res = document.getElementById(`fu-result-${id}`);
            if (!panel.classList.contains('hidden') && res.innerHTML === '') {
                document.getElementById(`fu-input-${id}`).focus();
            }
        }
    }

    window.sendFollowUp = async function (id) {
        const inputDom = document.getElementById(`fu-input-${id}`);
        const inputStr = inputDom.value.trim();
        const resBox = document.getElementById(`fu-result-${id}`);

        if (!inputStr) return;

        resBox.classList.remove('hidden');
        resBox.innerHTML = '<span class="typing-cursor">正在连接到强逻辑引擎通道...</span>';
        inputDom.value = ''; // clear input

        const item = MockFeed.find(n => n.id === id) || State.bookmarks.find(n => n.id === id);
        if (!item) return;

        const prompt = `背景：\n标题：《${item.title}》\n分析摘要：${item.summary}\n既定影响逻辑推测区：${item.pmVal} / ${item.pmBiz}\n\n当前 PM 高维极客对该事件抛出了深度刁钻追问：\n指令：【${inputStr}】\n\n请作为最毒舌、严密、直穿事物护城河本质的高薪技术咨询总架构师。\n一针见血用短平快回答。不要客气，不要废话，强逻辑推理。必须控制在120字硬通货字数以内！直接放结论：`;

        await callDeepSeek(prompt, (text, isDone) => {
            resBox.innerHTML = text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>') + (isDone ? '' : '<span class="typing-cursor"></span>');
        });
    }

    // === EVENT LISTENERS ===
    function bindEvents() {
        UI.btnHome.addEventListener('click', () => switchView('home'));
        UI.btnBookmarks.addEventListener('click', () => switchView('bookmarks'));
        UI.btnSettings.addEventListener('click', () => UI.modalSettings.classList.remove('hidden'));
        UI.closeModal.addEventListener('click', () => UI.modalSettings.classList.add('hidden'));
        UI.btnRefresh.addEventListener('click', refreshData);

        UI.btnTheme.addEventListener('click', () => {
            const html = document.documentElement;
            const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('pca_theme', newTheme);
        });

        UI.btnAddWatch.addEventListener('click', async () => {
            const tech = prompt('高阶锁定：请输入拟强制 AI 跟踪监控的前沿技术/模型名称 (如 "开源 Llama3"、"AutoGPT"):');
            if (tech && tech.trim()) {
                const newTech = { id: 'w_' + Date.now(), name: tech.trim(), hot: Math.floor(Math.random() * 50) + 40, trend: 'up' };
                State.watchedTechs.push(newTech);
                localStorage.setItem('pca_watched_techs', JSON.stringify(State.watchedTechs));
                renderRadar(); // re-render layout
                openDetail(newTech.id, newTech.name, 'watch');
            }
        });

        UI.dateFilter.addEventListener('change', renderFeed);
        UI.bookmarkSearch.addEventListener('input', renderBookmarks);

        // Settings panel interactions
        UI.btnAddSource.addEventListener('click', () => UI.addSourceForm.classList.remove('hidden'));
        UI.cancelNewSource.addEventListener('click', () => {
            UI.addSourceForm.classList.add('hidden');
            UI.newSourceName.value = '';
            UI.newSourceUrl.value = '';
        });
        UI.saveNewSource.addEventListener('click', () => {
            const n = UI.newSourceName.value.trim();
            const u = UI.newSourceUrl.value.trim();
            if (n && u) {
                State.sources.push({ id: 'usr_' + Date.now(), name: n, url: u, type: 'man' });
                saveSources();
                renderSources();
                UI.cancelNewSource.click();
            }
        });
        UI.btnSaveSettings.addEventListener('click', () => {
            saveSources();
            UI.modalSettings.classList.add('hidden');
        });

        // AI Pool Events
        UI.btnAddApi.addEventListener('click', () => UI.addApiForm.classList.remove('hidden'));
        UI.cancelNewApi.addEventListener('click', () => {
            UI.addApiForm.classList.add('hidden');
            UI.newApiName.value = UI.newApiUrl.value = UI.newApiKey.value = UI.newApiModel.value = '';
        });
        UI.saveNewApi.addEventListener('click', () => {
            const name = UI.newApiName.value.trim();
            const url = UI.newApiUrl.value.trim() || 'https://api.deepseek.com/v1';
            const key = UI.newApiKey.value.trim();
            const model = UI.newApiModel.value.trim() || 'deepseek-chat';
            if (name && key) {
                const newApi = { id: 'api_' + Date.now(), name, url, key, model };
                State.aiPool.push(newApi);
                if (State.aiPool.length === 1) State.activeApiId = newApi.id;
                savePool();
                renderAIEndpoints();
                UI.cancelNewApi.click();
            }
        });
    }

    function switchView(viewName) {
        State.view = viewName;
        if (viewName === 'home') {
            UI.viewHome.classList.remove('view-hidden');
            UI.viewBookmarks.classList.add('view-hidden');
            UI.btnHome.classList.add('active');
            UI.btnBookmarks.classList.remove('active');
        } else {
            UI.viewHome.classList.add('view-hidden');
            UI.viewBookmarks.classList.remove('view-hidden');
            UI.btnHome.classList.remove('active');
            UI.btnBookmarks.classList.add('active');
            renderBookmarks();
        }
    }

    // === SETTINGS ===
    function initTheme() {
        const saved = localStorage.getItem('pca_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
    }
    function loadSources() {
        const s = localStorage.getItem('pca_sources');
        if (s) State.sources = JSON.parse(s);
        renderSources();
        renderAIEndpoints();
    }
    function savePool() {
        localStorage.setItem('pca_ai_pool', JSON.stringify(State.aiPool));
        localStorage.setItem('pca_active_api_id', State.activeApiId);
    }
    function renderAIEndpoints() {
        UI.apiTbody.innerHTML = State.aiPool.map(a => `
            <tr class="${a.id === State.activeApiId ? 'active-row' : ''}">
                <td><i class="ph ${a.id === State.activeApiId ? 'ph-check-circle-fill' : 'ph-circle'}" onclick="setActiveApi('${a.id}')" style="cursor:pointer; color:var(--accent)"></i> ${a.name}</td>
                <td><span style="font-size:11px; color:var(--text-sec)">${a.model}</span></td>
                <td>${a.id === State.activeApiId ? '<span class="man-badge">运行中</span>' : '<span class="sys-badge" style="cursor:pointer" onclick="setActiveApi(\''+a.id+'\')">待命</span>'}</td>
                <td style="display:flex; gap:4px; padding-top:10px;">
                    <button class="del-btn" onclick="moveApi('${a.id}', -1)" title="上移"><i class="ph ph-caret-up"></i></button>
                    <button class="del-btn" onclick="moveApi('${a.id}', 1)" title="下移"><i class="ph ph-caret-down"></i></button>
                    <button class="del-btn" onclick="delApi('${a.id}')" title="删除"><i class="ph ph-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
    window.moveApi = function(id, direction) {
        const idx = State.aiPool.findIndex(a => a.id === id);
        if (idx === -1) return;
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= State.aiPool.length) return;
        
        // 交换位置
        const temp = State.aiPool[idx];
        State.aiPool[idx] = State.aiPool[newIdx];
        State.aiPool[newIdx] = temp;
        
        savePool();
        renderAIEndpoints();
    }
    window.setActiveApi = function(id) {
        State.activeApiId = id;
        savePool();
        renderAIEndpoints();
    }
    window.delApi = function(id) {
        State.aiPool = State.aiPool.filter(a => a.id !== id);
        if (State.activeApiId === id && State.aiPool.length > 0) State.activeApiId = State.aiPool[0].id;
        savePool();
        renderAIEndpoints();
    }
    function saveSources() {
        localStorage.setItem('pca_sources', JSON.stringify(State.sources));
    }
    function renderSources() {
        UI.sourceTbody.innerHTML = State.sources.map(s => `
            <tr>
                <td>${s.name} ${s.type === 'sys' ? '<span class="sys-badge">底座预装</span>' : '<span class="man-badge">用户注入</span>'}</td>
                <td><span style="font-family:monospace;font-size:12px;color:var(--text-sec)">${s.url}</span></td>
                <td>${s.type === 'sys' ? '直连 API' : 'RSS 窃取'}</td>
                <td>${s.type !== 'sys' ? `<button class="del-btn" onclick="delSource('${s.id}')"><i class="ph ph-trash"></i></button>` : ''}</td>
            </tr>
        `).join('');
    }
    window.delSource = function (id) {
        State.sources = State.sources.filter(s => s.id !== id);
        saveSources();
        renderSources();
    }
});
