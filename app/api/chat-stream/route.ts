import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API Key not configured' },
        { status: 500 }
      )
    }

    // Add system prompt
    const systemMessage = {
      role: 'system',
      content: 'You are a professional resume assistant. Your task is to help users collect and organize their personal information, work experience, educational background, skills, and other resume-related content. Please ask friendly questions and guide users to provide complete resume information.'
    }

    const response = await fetch(process.env.OPENROUTER_API_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
        'X-Title': 'AI Resume Editor',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_API_MODEL || 'anthropic/claude-3.5-sonnet',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true, // Enable streaming
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter API error:', error)
      return NextResponse.json(
        { error: 'AI chat failed' },
        { status: response.status }
      )
    }

    // Create a readable stream to forward the SSE data
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              controller.close()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const json = JSON.parse(data)
                  const content = json.choices[0]?.delta?.content || ''
                  
                  if (content) {
                    // Send the content chunk to the client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.error('Failed to parse SSE data:', e)
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat stream API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

