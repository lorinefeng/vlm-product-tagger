'use client';

import { motion } from 'framer-motion';

interface ProgressDisplayProps {
    current: number;
    total: number;
    status: 'idle' | 'parsing' | 'processing' | 'done' | 'error';
    errorMessage?: string;
}

export default function ProgressDisplay({ current, total, status, errorMessage }: ProgressDisplayProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    const statusText = {
        idle: '等待上传',
        parsing: '正在解析 Excel 文件...',
        processing: `正在处理商品标签 (${current}/${total})`,
        done: '处理完成！',
        error: errorMessage || '处理出错',
    };

    const statusColor = {
        idle: 'rgba(255,255,255,0.4)',
        parsing: '#d4af37',
        processing: '#d4af37',
        done: '#34c759',
        error: '#ff453a',
    };

    if (status === 'idle') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-8"
        >
            <div className="glass-card p-6">
                {/* 状态标题 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {status === 'processing' && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth={2}>
                                    <path d="M12 2v4m0 12v4m-7.07-2.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" />
                                </svg>
                            </motion.div>
                        )}
                        {status === 'done' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#34c759" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {status === 'error' && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#ff453a" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <span className="font-medium" style={{ fontFamily: 'Outfit', color: statusColor[status] }}>
                            {statusText[status]}
                        </span>
                    </div>
                    {(status === 'processing' || status === 'done') && (
                        <span className="text-2xl font-bold" style={{ fontFamily: 'Outfit', color: '#d4af37' }}>
                            {percentage}%
                        </span>
                    )}
                </div>

                {/* 进度条 */}
                {(status === 'processing' || status === 'done') && (
                    <div className="progress-bar">
                        <motion.div
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                    </div>
                )}

                {/* 处理详情 */}
                {status === 'processing' && current > 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 text-sm"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        AI 正在分析商品图片并生成特征标签，请耐心等待...
                    </motion.p>
                )}

                {/* 完成统计 */}
                {status === 'done' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 flex items-center gap-6"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: '#34c759' }} />
                            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                成功处理 {total} 个商品
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
