// API 路由测试：检查数据文件是否可访问
import { NextResponse } from 'next/server';

export async function GET() {
  const tests = [];
  
  // 测试1：检查文件路径
  try {
    const response = await fetch('http://localhost:3000/data/books.json');
    tests.push({
      test: 'books.json',
      status: response.ok ? 'OK' : 'FAIL',
      statusCode: response.status,
    });
  } catch (error: any) {
    tests.push({
      test: 'books.json',
      status: 'ERROR',
      error: error.message,
    });
  }
  
  // 测试2：检查大文件
  try {
    const response = await fetch('http://localhost:3000/data/CUVT_bible.json');
    tests.push({
      test: 'CUVT_bible.json',
      status: response.ok ? 'OK' : 'FAIL',
      statusCode: response.status,
      size: response.headers.get('content-length'),
    });
  } catch (error: any) {
    tests.push({
      test: 'CUVT_bible.json',
      status: 'ERROR',
      error: error.message,
    });
  }
  
  return NextResponse.json({
    message: 'Data file accessibility test',
    tests,
    env: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
    },
  });
}

