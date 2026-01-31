'use client';

import { motion } from 'framer-motion';

interface ResultDownloaderProps {
    results: Array<{
        productName: string;
        imageURL: string;
        tags: string;
    }>;
    onDownload: () => void;
    onReset: () => void;
}

export default function ResultDownloader({ results, onDownload, onReset }: ResultDownloaderProps) {
    if (results.length === 0) return null;

    const successCount = results.filter(r => r.tags && r.tags !== 'FAILED' && r.tags !== 'NO_IMAGE' && r.tags !== 'API_NOT_CONFIGURED').length;
    const failedCount = results.length - successCount;

    // 直接使用原生 button 而非 motion.button，避免可能的 framer-motion 问题
    const handleDownloadClick = () => {
        console.log('Download button clicked');
        onDownload();
    };

    const handleResetClick = () => {
        console.log('Reset button clicked');
        onReset();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-6"
        >
            {/* 移除 gold-border 类，使用内联样式 */}
            <div
                className="glass-card p-6"
                style={{
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                }}
            >
                {/* 结果统计 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Outfit' }}>
                            标签生成完成
                        </h3>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            共处理 {results.length} 个商品
                        </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#34c759' }} />
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>成功 {successCount}</span>
                        </div>
                        {failedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff453a' }} />
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>失败 {failedCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 预览表格 */}
                <div className="mb-6 max-h-96 overflow-auto rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <table className="w-full text-sm">
                        <thead className="sticky top-0" style={{ background: 'rgba(20,20,30,0.95)' }}>
                            <tr style={{ color: '#d4af37' }}>
                                <th className="text-left p-3 font-medium" style={{ width: '100px' }}>商品图片</th>
                                <th className="text-left p-3 font-medium" style={{ width: '200px' }}>商品名称</th>
                                <th className="text-left p-3 font-medium">生成标签</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.slice(0, 50).map((result, index) => (
                                <tr key={index} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    {/* 商品图片 */}
                                    <td className="p-3">
                                        {result.imageURL ? (
                                            <img
                                                src={result.imageURL}
                                                alt={result.productName}
                                                className="rounded-lg object-cover"
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    border: '1px solid rgba(212,175,55,0.2)',
                                                }}
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    const sibling = target.nextElementSibling as HTMLElement;
                                                    target.style.display = 'none';
                                                    if (sibling) sibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="rounded-lg flex items-center justify-center"
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: 'rgba(255,255,255,0.3)',
                                                fontSize: '12px',
                                                display: result.imageURL ? 'none' : 'flex',
                                            }}
                                        >
                                            无图
                                        </div>
                                    </td>
                                    {/* 商品名称 */}
                                    <td className="p-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        <div className="line-clamp-2" title={result.productName}>
                                            {result.productName || '未命名'}
                                        </div>
                                    </td>
                                    {/* 生成标签 */}
                                    <td className="p-3">
                                        {result.tags === 'FAILED' || result.tags === 'API_NOT_CONFIGURED' ? (
                                            <span style={{ color: '#ff453a' }}>处理失败</span>
                                        ) : result.tags === 'NO_IMAGE' ? (
                                            <span style={{ color: '#ff9f0a' }}>无图片</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {result.tags?.split('|').slice(0, 8).map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-0.5 rounded text-xs"
                                                        style={{
                                                            background: 'rgba(212,175,55,0.15)',
                                                            color: '#d4af37',
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {(result.tags?.split('|').length || 0) > 8 && (
                                                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                                        +{(result.tags?.split('|').length || 0) - 8}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {results.length > 50 && (
                        <div className="p-3 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            仅显示前 50 条，共 {results.length} 条结果
                        </div>
                    )}
                </div>

                {/* 操作按钮 - 使用原生 button */}
                <div className="flex gap-4" style={{ position: 'relative', zIndex: 100 }}>
                    <button
                        type="button"
                        onClick={handleDownloadClick}
                        className="btn-gold flex-1 flex items-center justify-center gap-2 cursor-pointer"
                        style={{ position: 'relative', zIndex: 101 }}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        下载结果 Excel
                    </button>
                    <button
                        type="button"
                        onClick={handleResetClick}
                        className="px-6 py-3.5 rounded-xl font-medium transition-all cursor-pointer"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)',
                            position: 'relative',
                            zIndex: 101
                        }}
                    >
                        重新上传
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
