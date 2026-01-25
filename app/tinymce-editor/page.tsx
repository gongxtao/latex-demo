'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    tinymce: any;
  }
}

interface HtmlFile {
  name: string;
  path: string;
}

export default function TinyMCEEditor() {
  const editorRef = useRef<any>(null);
  const [htmlFiles, setHtmlFiles] = useState<HtmlFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [tinyApiKey, setTinyApiKey] = useState<string>('no-api-key');
  const [isMockKey, setIsMockKey] = useState(false);

  useEffect(() => {
    // 获取TinyMCE API配置
    fetchTinyConfig();
    fetchHtmlFiles();
  }, []);

  const fetchTinyConfig = async () => {
    try {
      const response = await fetch('/api/tinymce/config');
      const data = await response.json();
      setTinyApiKey(data.apiKey);
      setIsMockKey(data.isMock);

      if (data.isMock) {
        console.warn('Using mock TinyMCE API Key - production use requires a real key');
      }
    } catch (err) {
      console.error('Error fetching TinyMCE config:', err);
    }
  };

  // 当脚本加载完成后初始化编辑器
  useEffect(() => {
    if (scriptLoaded && typeof window !== 'undefined' && window.tinymce) {
      initTinyMCE();
    }

    // 清理函数
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.remove();
        } catch (e) {
          console.log('Editor cleanup error:', e);
        }
      }
    };
  }, [scriptLoaded]);

  const initTinyMCE = () => {
    try {
      // 如果已经初始化过，先移除
      if (window.tinymce.get('tinymce-editor')) {
        window.tinymce.get('tinymce-editor').remove();
      }

      window.tinymce.init({
        selector: '#tinymce-editor',
        height: 'calc(100vh - 280px)',
        menubar: true,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar:
          'undo redo | blocks | bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | code fullscreen | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        setup: (editor: any) => {
          editorRef.current = editor;
          editor.on('init', () => {
            console.log('TinyMCE editor initialized');
            setEditorReady(true);
          });
          editor.on('Change', handleEditorChange);
          editor.on('KeyUp', handleEditorChange);
        },
        // 允许所有HTML标签和样式
        valid_elements: '*[*]',
        // 允许所有样式
        valid_styles: {
          '*': '*'
        },
        // 允许所有class
        valid_classes: {
          '*': '*'
        },
        // 保留完整的HTML结构
        extended_valid_elements: '*[*]',
        // 不清理HTML
        verify_html: false,
        // 保留所有格式
        cleanup: false
      });
    } catch (err) {
      console.error('TinyMCE initialization error:', err);
      setError('编辑器初始化失败');
    }
  };

  const fetchHtmlFiles = async () => {
    try {
      const response = await fetch('/api/tinymce/files');
      const data = await response.json();

      if (data.success) {
        const files = data.files.map((file: string) => ({
          name: file.split('/').pop() || file,
          path: file
        }));
        setHtmlFiles(files);
      } else {
        setError('获取文件列表失败');
      }
    } catch (err) {
      console.error('Error fetching HTML files:', err);
      setError('获取文件列表失败');
    }
  };

  const loadHtmlContent = async (filePath: string) => {
    if (!editorRef.current) {
      setError('编辑器未就绪');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/tinymce/content/${filePath}`);
      const data = await response.json();

      if (data.success) {
        // 设置编辑器内容
        editorRef.current.setContent(data.content);
        setSelectedFile(filePath);
      } else {
        setError(data.error || '加载文件失败');
      }
    } catch (err) {
      console.error('Error loading HTML content:', err);
      setError('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const filePath = e.target.value;
    if (filePath) {
      loadHtmlContent(filePath);
    } else {
      setSelectedFile('');
      if (editorRef.current) {
        editorRef.current.setContent('');
      }
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      console.log('Editor content changed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 加载TinyMCE脚本 */}
      {tinyApiKey && (
        <Script
          src={`https://cdn.tiny.cloud/1/${tinyApiKey}/tinymce/6/tinymce.min.js`}
          strategy="afterInteractive"
          onReady={() => {
            console.log('TinyMCE script loaded');
            setScriptLoaded(true);
          }}
          onError={(e) => {
            console.error('TinyMCE script load error:', e);
            setError('TinyMCE脚本加载失败');
          }}
        />
      )}

      {/* Mock API Key 警告 */}
      {isMockKey && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium">使用 Mock API Key</p>
              <p className="text-yellow-700 text-sm mt-1">
                当前使用的是开发测试用的 API Key。请在 <code className="bg-yellow-100 px-1 rounded">.env</code> 文件中配置 <code className="bg-yellow-100 px-1 rounded">TINYMCE_API_KEY</code> 环境变量以使用你自己的 API Key。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TinyMCE HTML 编辑器
          </h1>
          <p className="text-gray-600">
            选择HTML文件进行编辑，支持源码模式和可视化模式切换
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* File Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="file-select" className="font-medium text-gray-700 whitespace-nowrap">
              选择HTML文件:
            </label>
            <select
              id="file-select"
              value={selectedFile}
              onChange={handleFileChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={loading || !editorReady}
            >
              <option value="">-- 请选择文件 --</option>
              {htmlFiles.map((file) => (
                <option key={file.path} value={file.path}>
                  {file.name} ({file.path})
                </option>
              ))}
            </select>
            {loading && (
              <div className="text-blue-600 flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>加载中...</span>
              </div>
            )}
            {!scriptLoaded && (
              <div className="text-gray-500 text-sm">
                正在加载编辑器...
              </div>
            )}
            {scriptLoaded && editorReady && (
              <div className="text-green-600 text-sm">
                ✓ 编辑器就绪
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                当前编辑: <span className="font-medium">{selectedFile}</span>
              </p>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {scriptLoaded ? (
            <textarea
              id="tinymce-editor"
              defaultValue=""
              className="w-full"
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">正在加载编辑器...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">使用说明</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>从下拉菜单中选择要编辑的HTML文件</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>在编辑器中直接编辑内容，所见即所得</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>点击工具栏的<strong className="text-gray-900">代码</strong>按钮可以切换到源码模式查看/编辑HTML代码</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>所有编辑会保留原始HTML的样式和结构</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>点击<strong className="text-gray-900">全屏</strong>按钮可以进入全屏编辑模式</span>
            </li>
          </ul>
        </div>

        {/* Current Content Info */}
        {editorReady && editorRef.current && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-2">编辑器信息</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 编辑器状态: <span className="text-green-600">运行中</span></p>
              <p>• 当前文件: <span className="font-medium">{selectedFile || '未选择'}</span></p>
              <p>• 内容长度: <span className="font-mono">{editorRef.current.getContent().length}</span> 字符</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
