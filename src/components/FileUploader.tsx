'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    isProcessing: boolean;
}

export default function FileUploader({ onFileSelect, isProcessing }: FileUploaderProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleClick = () => {
        if (!isProcessing) {
            fileInputRef.current?.click();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full"
        >
            {/* 格式说明卡片 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 p-5 rounded-2xl"
                style={{
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(212, 175, 55, 0.15)' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#d4af37">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2" style={{ fontFamily: 'Outfit', color: '#d4af37' }}>
                            文件格式要求
                        </h3>
                        <div className="text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <p>上传的 Excel 或 CSV 文件仅需包含 <strong>两列</strong> 商品信息：</p>
                            <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr style={{ color: '#d4af37' }}>
                                            <th className="text-left pb-2">第一列：商品名称</th>
                                            <th className="text-left pb-2">第二列：imageURL</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ color: 'rgba(255,255,255,0.5)' }}>
                                        <tr>
                                            <td className="py-1">Loewe 手提包 2024款</td>
                                            <td className="py-1">https://example.com/img1.jpg</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">Loewe 连衣裙 蓝色</td>
                                            <td className="py-1">https://example.com/img2.jpg</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 上传区域 */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`upload-zone relative cursor-pointer rounded-3xl p-12 text-center transition-all duration-300 ${isDragOver ? 'dragover' : ''
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                    background: isDragOver ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isProcessing}
                />

                <AnimatePresence mode="wait">
                    {selectedFile ? (
                        <motion.div
                            key="selected"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: 'rgba(52, 199, 89, 0.15)' }}>
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#34c759">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium" style={{ fontFamily: 'Outfit' }}>
                                {selectedFile.name}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                                style={{ background: 'rgba(212, 175, 55, 0.1)' }}
                            >
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#d4af37">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </motion.div>
                            <p className="text-xl font-medium mb-2" style={{ fontFamily: 'Outfit' }}>
                                拖拽或点击上传文件
                            </p>
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                支持 .xlsx、.xls、.csv 格式
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
