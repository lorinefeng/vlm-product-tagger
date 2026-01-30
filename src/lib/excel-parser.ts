import * as XLSX from 'xlsx';

export interface ProductRow {
    productName: string;
    imageURL: string;
}

export interface ParseResult {
    success: boolean;
    products?: ProductRow[];
    error?: string;
}

/**
 * 解析 CSV 文件内容
 */
function parseCSVContent(content: string): string[][] {
    const lines = content.split(/\r?\n/);
    const result: string[][] = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        // 简单 CSV 解析，支持逗号分隔
        const cells = line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
        result.push(cells);
    }

    return result;
}

/**
 * 解析上传的文件（Excel 或 CSV）
 * 期望格式：第一列为商品名称，第二列为图片 URL
 */
export function parseExcelFile(buffer: ArrayBuffer, fileName?: string): ParseResult {
    try {
        let rawData: string[][];

        // 检测文件类型
        const isCSV = fileName?.toLowerCase().endsWith('.csv');

        if (isCSV) {
            // CSV 解析
            const decoder = new TextDecoder('utf-8');
            const content = decoder.decode(buffer);
            rawData = parseCSVContent(content);
        } else {
            // Excel 解析
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        }

        if (rawData.length === 0) {
            return { success: false, error: '文件为空' };
        }

        // 跳过可能的表头行（检测第一行是否为标题）
        let startIndex = 0;
        const firstRow = rawData[0];
        if (firstRow && typeof firstRow[0] === 'string') {
            const firstCell = firstRow[0].toLowerCase();
            if (firstCell.includes('名称') || firstCell.includes('name') || firstCell.includes('商品') || firstCell.includes('product')) {
                startIndex = 1;
            }
        }

        const products: ProductRow[] = [];

        for (let i = startIndex; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length < 2) continue;

            const productName = String(row[0] || '').trim();
            const imageURL = String(row[1] || '').trim();

            // 跳过空行
            if (!productName && !imageURL) continue;

            // 验证图片 URL
            if (!imageURL.startsWith('http')) {
                console.warn(`Row ${i + 1}: Invalid image URL: ${imageURL}`);
            }

            products.push({ productName, imageURL });
        }

        if (products.length === 0) {
            return { success: false, error: '未找到有效的商品数据' };
        }

        return { success: true, products };
    } catch (error) {
        console.error('File parsing error:', error);
        return { success: false, error: '文件解析失败，请检查格式' };
    }
}

/**
 * 将结果导出为 Excel 文件
 */
export function exportToExcel(results: Array<{ productName: string; imageURL: string; tags: string }>): Blob {
    const worksheet = XLSX.utils.json_to_sheet(results.map(r => ({
        '商品名称': r.productName,
        '图片URL': r.imageURL,
        '标签': r.tags,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '标签结果');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
