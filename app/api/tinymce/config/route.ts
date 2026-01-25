import { NextResponse } from 'next/server';

export async function GET() {
  // 从环境变量获取TinyMCE API Key
  const apiKey = process.env.TINYMCE_API_KEY || 'no-api-key';

  return NextResponse.json({
    apiKey,
    // 如果使用mock值，返回提示信息
    isMock: apiKey === 'no-api-key'
  });
}
