'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import FileUploader from '@/components/FileUploader';
import ProgressDisplay from '@/components/ProgressDisplay';
import ResultDownloader from '@/components/ResultDownloader';
import { parseExcelFile, exportToExcel, type ProductRow } from '@/lib/excel-parser';

type ProcessStatus = 'idle' | 'parsing' | 'processing' | 'done' | 'error';

interface TagResult {
  productName: string;
  imageURL: string;
  tags: string;
}

interface HistoryRecord {
  id: string;
  timestamp: string;
  results: TagResult[];
  fileName: string;
}

const STORAGE_KEY = 'vlm_tagger_history';

export default function Home() {
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<TagResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [currentFileName, setCurrentFileName] = useState('');

  // 从 localStorage 加载历史记录
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        // 如果有历史记录，自动加载最近的一条
        if (parsed.length > 0) {
          const latest = parsed[0];
          setResults(latest.results);
          setStatus('done');
          setCurrentFileName(latest.fileName);
        }
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // 保存结果到 localStorage
  const saveToHistory = useCallback((newResults: TagResult[], fileName: string) => {
    const record: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      results: newResults,
      fileName,
    };

    const newHistory = [record, ...history.slice(0, 9)]; // 最多保留 10 条
    setHistory(newHistory);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history]);

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus('parsing');
    setErrorMessage('');
    setResults([]);
    setCurrentFileName(file.name);

    try {
      // 读取文件
      const buffer = await file.arrayBuffer();
      const parseResult = parseExcelFile(buffer, file.name);

      if (!parseResult.success || !parseResult.products) {
        setStatus('error');
        setErrorMessage(parseResult.error || '解析失败');
        return;
      }

      const products = parseResult.products;
      setProgress({ current: 0, total: products.length });
      setStatus('processing');

      // 批量处理商品
      const batchSize = 5;
      const allResults: TagResult[] = [];

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        try {
          const response = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: batch }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const batchResults = await response.json();
          allResults.push(...batchResults.results);
          setProgress({ current: Math.min(i + batchSize, products.length), total: products.length });
        } catch (error) {
          console.error('Batch processing error:', error);
          // 对失败的批次标记为 FAILED
          batch.forEach((p: ProductRow) => {
            allResults.push({
              productName: p.productName,
              imageURL: p.imageURL,
              tags: 'FAILED',
            });
          });
          setProgress({ current: Math.min(i + batchSize, products.length), total: products.length });
        }
      }

      setResults(allResults);
      setStatus('done');

      // 保存到历史记录
      saveToHistory(allResults, file.name);
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('error');
      setErrorMessage('处理过程中发生错误');
    }
  }, [saveToHistory]);

  const handleDownload = useCallback(() => {
    console.log('handleDownload called, results:', results.length);
    if (results.length === 0) {
      console.error('No results to download');
      alert('没有可下载的结果');
      return;
    }
    try {
      const blob = exportToExcel(results);
      console.log('Blob created:', blob.size, 'bytes');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `商品标签结果_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Download triggered successfully');
    } catch (error) {
      console.error('Download error:', error);
      alert('下载失败: ' + (error as Error).message);
    }
  }, [results]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setProgress({ current: 0, total: 0 });
    setResults([]);
    setErrorMessage('');
    setCurrentFileName('');
  }, []);

  // 加载历史记录
  const loadHistory = useCallback((record: HistoryRecord) => {
    setResults(record.results);
    setStatus('done');
    setCurrentFileName(record.fileName);
  }, []);

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isProcessing = status === 'parsing' || status === 'processing';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(100,80,180,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.2)',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: '#34c759' }} />
            <span className="text-sm font-medium" style={{ color: '#d4af37' }}>
              AI 视觉智能
            </span>
          </motion.div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}
          >
            <span style={{ color: '#d4af37' }}>VLM</span>{' '}
            <span style={{ color: '#f5f5f7' }}>商品标签器</span>
          </h1>

          <p
            className="text-lg max-w-md mx-auto"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            上传商品 Excel，AI 自动分析图片生成搜索友好的特征标签
          </p>
        </motion.div>

        {/* 主卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card p-8"
        >
          <FileUploader onFileSelect={handleFileSelect} isProcessing={isProcessing} />

          <ProgressDisplay
            current={progress.current}
            total={progress.total}
            status={status}
            errorMessage={errorMessage}
          />
        </motion.div>

        {/* 结果区域 */}
        {status === 'done' && results.length > 0 && (
          <ResultDownloader
            results={results}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}

        {/* 历史记录 */}
        {history.length > 0 && status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#d4af37' }}>
                历史记录
              </h3>
              <button
                type="button"
                onClick={clearHistory}
                className="text-sm px-3 py-1 rounded-lg cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}
              >
                清空
              </button>
            </div>
            <div className="space-y-2">
              {history.slice(0, 5).map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => loadHistory(record)}
                  className="w-full text-left p-3 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{record.fileName}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {new Date(record.timestamp).toLocaleDateString('zh-CN')} {new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {record.results.length} 个商品
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 页脚 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-sm"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          Powered by Qwen3-VL-Plus Vision Model
        </motion.p>
      </div>
    </main>
  );
}
