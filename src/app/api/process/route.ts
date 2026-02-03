import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// VLM API 配置
// 优先使用 DashScope 国际端点（新加坡节点），Vercel 可访问
// 如需使用国内 API，请设置 APPLESAY_BASE_URL
const apiKey = process.env.DASHSCOPE_API_KEY || process.env.APPLESAY_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.DASHSCOPE_BASE_URL || process.env.APPLESAY_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const modelName = process.env.VLM_MODEL || process.env.APPLESAY_MODEL || 'qwen-vl-plus';

const client = apiKey ? new OpenAI({
    apiKey,
    baseURL,
    timeout: 60000, // 60秒超时
}) : null;

// 系统提示词
const SYSTEM_PROMPT = `你是一位奢侈品与时尚专家，擅长从视觉角度准确、简洁地描述商品特征，以便于搜索引擎索引。

你的任务是根据商品名称和图片，生成最符合用户搜索习惯的特征标签。

核心要求（优先级从高到低）：
1. 核心品类识别：必须包含基础品类词（如：手提包、连衣裙、T恤、运动鞋、钱包、耳环、手链等）。
2. 简洁准确：标签以"短促、平实"为主，通常 2-4 个字；每个标签只表达一个概念，禁止把多个信息拼成一句话。
3. 视觉互补：优先输出图片里能看见但文本可能缺失的内容（颜色、材质外观、图案、轮廓、开合方式等）。
4. 氛围感词：2-3个，保留 1-2 个通用风格词（如：老钱风、静奢风、森系、多巴胺）。

数量与格式：
- 生成 12-16 个标签。
- 输出必须严格为 JSON 数组，例如：["标签1", "标签2", ...]。`;

// 品类标记集合（用于后处理过滤）
const CLOTHING_MARKERS = new Set(['T恤', '衬衫', '毛衣', '卫衣', '夹克', '外套', '连衣裙', '半身裙', '裙', '裤', '牛仔裤', '大衣', '风衣', '西装']);
const SHOE_MARKERS = new Set(['运动鞋', '高跟鞋', '凉鞋', '靴', '靴子', '乐福鞋', '平底鞋', '拖鞋']);
const BAG_MARKERS = new Set(['手提包', '斜挎包', '肩背包', '双肩包', '托特包', '手拿包', '钱包', '卡包', '腰包', '背包', '公文包']);
const SLEEVE_TAGS = new Set(['长袖', '短袖', '无袖', '七分袖']);
const NECK_TAGS = new Set(['圆领', 'V领', '翻领', '立领', '高领']);
const SHOE_LACE_TAGS = new Set(['有鞋带', '无鞋带', '圆绳鞋带', '扁平鞋带', '棉质鞋带', '编织鞋带', '皮革鞋带', '丝绸鞋带']);

function processTags(rawTags: string[]): string[] {
    // 清洗标签
    const cleaned: string[] = [];
    for (const t of rawTags) {
        if (!t) continue;
        const s = String(t).trim();
        if (!s || s.includes('\n') || s.includes('|') || s.length > 12) continue;
        cleaned.push(s);
    }

    // 去重
    const tags = [...new Set(cleaned)];

    // 判断品类
    const isBag = tags.some(t => BAG_MARKERS.has(t));
    const isShoe = tags.some(t => SHOE_MARKERS.has(t));
    const isClothing = tags.some(t => CLOTHING_MARKERS.has(t)) && !isBag && !isShoe;

    // 过滤不匹配的标签
    return tags.filter(t => {
        if ((SLEEVE_TAGS.has(t) || NECK_TAGS.has(t)) && !isClothing) return false;
        if (SHOE_LACE_TAGS.has(t) && !isShoe) return false;
        return true;
    });
}

async function tagProduct(productName: string, imageURL: string): Promise<string> {
    if (!client) {
        return 'API_NOT_CONFIGURED';
    }

    if (!imageURL.startsWith('http')) {
        return 'NO_IMAGE';
    }

    // 清理 URL - 去掉 OSS 图片处理参数，使用原始图片
    let cleanURL = imageURL;
    if (imageURL.includes('?x-oss-process')) {
        cleanURL = imageURL.split('?')[0];
    }

    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await client.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: `商品名称: ${productName}` },
                            { type: 'image_url', image_url: { url: cleanURL } },
                        ] as OpenAI.ChatCompletionContentPart[],
                    },
                ],
                temperature: 0.3,
                max_tokens: 500,
            });

            let content = response.choices[0]?.message?.content?.trim() || '';

            // 提取 JSON 数组
            if (content.includes('```json')) {
                content = content.split('```json')[1].split('```')[0].trim();
            } else if (content.includes('```')) {
                content = content.split('```')[1].split('```')[0].trim();
            }

            let tags: string[];
            try {
                tags = JSON.parse(content);
            } catch {
                const match = content.match(/\[[\s\S]*\]/);
                if (!match) throw new Error('No JSON array found');
                tags = JSON.parse(match[0]);
            }

            if (!Array.isArray(tags)) {
                tags = [String(tags)];
            }

            const processedTags = processTags(tags);
            return processedTags.join('|');
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed for ${productName}:`, error);
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    return 'FAILED';
}

export async function POST(request: NextRequest) {
    try {
        const { products } = await request.json();

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'Invalid products array' }, { status: 400 });
        }

        // 并行处理商品（限制并发为 5）
        const results = await Promise.all(
            products.map(async (p: { productName: string; imageURL: string }) => {
                const tags = await tagProduct(p.productName, p.imageURL);
                return {
                    productName: p.productName,
                    imageURL: p.imageURL,
                    tags,
                };
            })
        );

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Process API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
