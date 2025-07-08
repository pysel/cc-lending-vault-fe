import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL, API_KEY } from '@/lib/constants';

// Bot API configuration
const BOT_API_BASE_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'https://bot-api.yourdomain.com';
const BOT_API_KEY = process.env.NEXT_PUBLIC_BOT_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');
  const searchParams = request.nextUrl.searchParams;

  // Determine which API to use based on path prefix
  const isBotApi = pathString.startsWith('bot/');
  const baseUrl = isBotApi ? BOT_API_BASE_URL : API_BASE_URL;
  const apiKey = isBotApi ? BOT_API_KEY : API_KEY;

  // For bot API, keep the full path including 'bot/' since the bot expects '/api/bot/'
  const apiPath = isBotApi ? pathString : pathString;

  try {
    // Build the API URL with any query parameters
    const apiUrl = new URL(`/api/${apiPath}`, baseUrl);
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key header if available (bot API might not need authentication)
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(apiUrl.toString(), {
      headers,
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    // If it's a bot API response with the wrapper format, extract the data
    if (isBotApi && data.success && data.data !== undefined) {
      return NextResponse.json(data.data);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`API Error for ${isBotApi ? 'Bot' : 'OneBalance'} API:`, error);
    console.log(error);
    return NextResponse.json(
      {
        message: `Failed to fetch data from ${isBotApi ? 'Bot' : 'OneBalance'} API`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathString = path.join('/');

  // Determine which API to use based on path prefix
  const isBotApi = pathString.startsWith('bot/');
  const baseUrl = isBotApi ? BOT_API_BASE_URL : API_BASE_URL;
  const apiKey = isBotApi ? BOT_API_KEY : API_KEY;

  // For bot API, keep the full path including 'bot/' since the bot expects '/api/bot/'
  const apiPath = isBotApi ? pathString : pathString;

  try {
    const body = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key header if available
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(`${baseUrl}/api/${apiPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.log('ERROR', await response.json());
      // console.error(`API Error for ${isBotApi ? 'Bot' : 'OneBalance'} API:`, response);
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    // If it's a bot API response with the wrapper format, extract the data
    if (isBotApi && data.success && data.data !== undefined) {
      return NextResponse.json(data.data);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`API Error for ${isBotApi ? 'Bot' : 'OneBalance'} API:`, error);
    return NextResponse.json(
      {
        message: `Failed to fetch data from ${isBotApi ? 'Bot' : 'OneBalance'} API`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
