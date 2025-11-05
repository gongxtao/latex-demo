import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { messages, latexContent } = await request.json()
    
    if (!messages || !latexContent) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Build conversation summary
    const conversationSummary = messages
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n')

    // Create system prompt for resume generation
    const systemMessage = {
      role: 'system',
      content: `You are a professional HTML resume editing assistant. You need to modify HTML resume templates based on the conversation between the user and the assistant.

Important requirements:
1. Only modify the content section, keep the HTML structure and styles intact
2. Fill in or update information in the resume based on user-provided information: name, contact details, work experience, education, skills, etc.
3. Maintain professional resume formatting and layout
4. Ensure the HTML structure is complete and valid
5. Preserve all CSS style code
6. Return complete HTML code

Please return the modified complete HTML code directly, without any explanations or additional text.`
    }

    const userMessage = {
      role: 'user',
      content: `Based on the following conversation content and HTML template, generate a customized resume:

Conversation History:
${conversationSummary}

Original HTML Template:
\`\`\`html
${latexContent}
\`\`\`

Please modify the above HTML template based on the information provided by the user in the conversation to generate a complete resume.`
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
        messages: [systemMessage, userMessage],
        temperature: 0.3,
        max_tokens: 8000,
        stream: true, // Enable streaming
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter API error:', error)
      return NextResponse.json(
        { error: 'AI generation failed' },
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
    console.error('Generate resume stream API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

