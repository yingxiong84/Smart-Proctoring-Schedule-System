import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { processTeacherFile, processScheduleFile, FileProcessingResult } from '../utils/fileProcessing';
import { Teacher, Schedule } from '../types';
import Alert from './ui/Alert';
import LoadingSpinner from './ui/LoadingSpinner';

interface FileUploadProps {
  type: 'teacher' | 'schedule';
  onDataLoaded: (data: Teacher[] | Schedule[]) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ type, onDataLoaded, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<FileProcessingResult<any> | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const config = {
    teacher: {
      label: '教师名单',
      icon: '👥',
      accept: '.xlsx,.xls,.csv',
      description: '支持Excel或CSV格式',
      processor: processTeacherFile,
      color: 'blue'
    },
    schedule: {
      label: '考场安排',
      icon: '📅',
      accept: '.xlsx,.xls,.csv',
      description: '支持Excel或CSV格式',
      processor: processScheduleFile,
      color: 'green'
    }
  };

  const currentConfig = config[type];

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setProcessingResult(null);
    
    try {
      const result = await currentConfig.processor(file);
      setProcessingResult(result);
      
      if (result.errors.length === 0) {
        setUploadedFile(file);
        onDataLoaded(result.data);
      }
    } catch (error) {
      setProcessingResult({
        data: [],
        errors: [error instanceof Error ? error.message : '文件处理失败'],
        warnings: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentConfig.processor, onDataLoaded]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemove = useCallback(() => {
    setUploadedFile(null);
    setProcessingResult(null);
    onDataLoaded([]);
  }, [onDataLoaded]);

  const inputId = `file-input-${type}`;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* File Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer group
          ${isDragOver 
            ? `border-${currentConfig.color}-400 bg-${currentConfig.color}-50 scale-105` 
            : uploadedFile 
              ? `border-${currentConfig.color}-400 bg-${currentConfig.color}-50/50` 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isLoading ? 'pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploadedFile && !isLoading && document.getElementById(inputId)?.click()}
      >
        <input
          id={inputId}
          type="file"
          accept={currentConfig.accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-4">
            <LoadingSpinner size="sm" className={`text-${currentConfig.color}-500`} />
            <span className="text-sm text-gray-600 font-medium">智能解析中...</span>
          </div>
        ) : uploadedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${currentConfig.color}-100 rounded-lg`}>
                <FileText className={`w-5 h-5 text-${currentConfig.color}-600`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-gray-500">
                    {processingResult?.data.length || 0} 条记录
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors group"
              title="移除文件"
            >
              <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className={`p-3 bg-${currentConfig.color}-100 rounded-xl group-hover:scale-110 transition-transform`}>
              <Upload className={`w-6 h-6 text-${currentConfig.color}-600`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 mb-1">
                上传{currentConfig.label}
              </p>
              <p className="text-xs text-gray-500">{currentConfig.description}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-400">支持拖拽上传</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Results */}
      {processingResult && (
        <div className="space-y-2">
          {processingResult.errors.length > 0 && (
            <Alert
              type="error"
              title="处理错误"
              message={processingResult.errors.join('\n')}
            />
          )}
          {processingResult.warnings.length > 0 && (
            <Alert
              type="warning"
              title="处理警告"
              message={processingResult.warnings.join('\n')}
            />
          )}
          {processingResult.errors.length === 0 && processingResult.data.length > 0 && (
            <Alert
              type="success"
              message={`成功加载 ${processingResult.data.length} 条${currentConfig.label}记录`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;