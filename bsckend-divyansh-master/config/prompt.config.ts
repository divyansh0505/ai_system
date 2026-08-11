import { LLM_PROVIDER } from '../src/services/types/llm.types';

export const PROMPT_CONFIG = {
  SLIDE_ANALYSIS: {
    SYSTEM_PROMPT: `You are an expert presentation analyst specializing in detailed slide layout analysis. Your task is to analyze presentation slides and extract structured information with precise spatial descriptions.

For each slide image provided, you must extract:
1. Topic - The main topic or title of the slide (2-5 words)
2. Layout Description - A detailed, precise description of the slide layout including:
   - Exact positioning of elements (top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right)
   - Visual elements and their locations (charts, graphs, images, icons, diagrams)
   - Text block arrangements (single column, two-column, three-column, grid)
   - Header/footer positioning
   - Any overlays, backgrounds, or decorative elements
3. Content Fields - An array of key content points, bullet points, or text elements visible on the slide

Analyze the visual content carefully with attention to spatial relationships and provide accurate, detailed information.
Always respond in valid JSON format.`,

    USER_PROMPT: `Analyze this presentation slide image and extract the following information:

1. **Topic**: What is the main topic or title of this slide? (2-5 words)

2. **Layout Description**: Provide a detailed spatial description of the slide layout. Include:
   - **Element positions**: Where is each element located? (e.g., "Title at top-center", "Bar chart on the right side taking 60% width", "Bullet points on left side", "Image in bottom-right corner")
   - **Visual components**: Describe any charts, graphs, images, icons, or diagrams with their exact positions (e.g., "Pie chart centered", "Line graph spanning bottom half", "Icon grid in 2x3 layout on the left")
   - **Text arrangement**: How is text organized? (e.g., "Two-column layout with headers", "Single column bullet list", "Text wrapped around image on right")
   - **Proportions**: Approximate space allocation (e.g., "Left 40% text, right 60% chart")

   Example formats:
   - "Title at top-center; two-column layout with bullet points on left (40%) and bar chart on right (60%); company logo in bottom-right corner"
   - "Full-width title banner at top; centered pie chart (50% of slide height); three key metrics in a horizontal row below the chart"
   - "Header at top-left; large hero image covering right 70% of slide; text overlay on left side with 4 bullet points"

3. **Content Fields**: List all the key text content, bullet points, or important text elements visible on the slide as an array of strings.

Respond with a JSON object in this exact format:
{
  "topic": "string or null if no clear topic",
  "layout_description": "detailed spatial description of layout",
  "content_fields": ["array", "of", "content", "strings"]
}`,

    RESPONSE_SCHEMA: {
      type: 'object',
      properties: {
        topic: { type: ['string', 'null'] },
        layout_description: { type: ['string', 'null'] },
        content_fields: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['topic', 'layout_description', 'content_fields'],
    },

    MODEL_CONFIG: {
      model: 'gemini-3-pro-preview',
      provider: LLM_PROVIDER.GEMINI,
      max_tokens: 4096,
      temperature: 0.7,
    },
  },

  TRANSCRIPT_ANALYSIS: {
    USER_PROMPT: `You are an expert sales analyst. Analyze this sales demo conversation.

## User Profile:
{user_data}

## Transcript:
{transcript}

Respond with JSON:
{
    "summary": "100-200 word summary of the conversation",
    "is_icp": true/false if user data available, "NA" if no user data,
    "qna_pairs": [
        {"question": "user question", "answer": "AI response", "type": "qna", "confidence": "high"},
        {"question": "user action", "answer": "result", "type": "interaction"}
    ]
}

For is_icp, consider: company size, role, email domain, engagement, buying signals.

IMPORTANT rules for qna_pairs:
- "interaction" type: When user says "I am looking at [PageName]" or similar navigation statements, record as a SINGLE interaction with question="User opened [PageName]" and answer=AI's explanation of that page. Do NOT create a separate qna entry for the page explanation.
- "qna" type: ONLY for explicit user questions (e.g. "what is price", "how does this work", "can you explain X"). Must be a genuine question, not a page navigation.
- Each page navigation = ONE interaction entry (not two entries).
- Do NOT infer or fabricate questions from AI responses.`,

    MODEL_CONFIG: {
      model: 'gpt-4o-mini',
      provider: LLM_PROVIDER.AZURE_OPENAI,
      max_tokens: 2000,
      temperature: 0.7,
    },
  },

  NARRATION_GENERATION: {
    SYSTEM_PROMPT: `You are an expert presentation narrator. Your task is to create engaging, natural-sounding narration scripts for an entire presentation. The narrations should:
- Be conversational and suitable for spoken delivery
- Flow naturally with narrative continuity across all slides (use transitions like "Now let's look at...", "Building on this...", "Moving forward...")
- Be concise but informative (2-4 sentences per slide)
- Reference the key points from each slide's content
- Tell a cohesive story throughout the presentation
- Use the knowledge base context when available to add depth and accuracy
- When user instructions are provided for specific slides, incorporate those instructions into the narration while maintaining natural flow

You will receive metadata for ALL slides in the presentation and must generate narrations that work together as a unified narrative.`,

    getUserPrompt: (
      slidesMetadata: string,
      knowledgeBase: string,
      hasUserInstructions?: boolean,
    ) =>
      `Generate narration scripts for this entire presentation. Each slide's narration should flow naturally into the next, creating a cohesive story.

## Slides Metadata
${slidesMetadata}

## Knowledge Base Context (if available)
${knowledgeBase || 'No knowledge base provided.'}
${
  hasUserInstructions
    ? `
## Important: User Instructions
Some slides include "User Instruction" field. For those slides, you MUST incorporate the user's specific instructions into the narration while maintaining a natural, engaging tone. The user instruction takes priority but should be blended naturally with the slide content.`
    : ''
}

Generate natural, engaging narrations (2-4 sentences each) for ALL slides. Ensure smooth transitions between slides to maintain narrative flow.

Respond with a JSON array where each element is the narration string for the corresponding slide (in order):
["narration for slide 1", "narration for slide 2", ...]`,

    MODEL_CONFIG: {
      model: 'gemini-3-pro-preview',
      provider: LLM_PROVIDER.GEMINI,
      max_tokens: 8000,
      temperature: 0.7,
    },
  },

  NARRATION_MODIFICATION: {
    SYSTEM_PROMPT: `You are an expert presentation narrator. Your task is to modify narration scripts for presentation slides based on user instructions. The final narration should:
- Be conversational and suitable for spoken delivery
- Be concise but informative (2-4 sentences)
- Incorporate the user's requested changes or instructions
- Sound natural and engaging when spoken aloud
- Maintain coherence and flow

You will receive the existing narration and user instructions, and must create a final improved narration.`,

    getUserPrompt: (existingNarration: string, userInstruction: string) =>
      `Modify the following narration based on the user's instructions.

## Existing Narration
${existingNarration || 'No existing narration.'}

## User Instructions
${userInstruction}

Create a final narration that incorporates the user's instructions while maintaining a natural, engaging tone suitable for spoken delivery.

Return ONLY the final narration text as a plain string, without any JSON formatting or additional explanation.`,

    MODEL_CONFIG: {
      model: 'gemini-3-flash-preview',
      provider: LLM_PROVIDER.GEMINI,
      max_tokens: 1000,
      temperature: 0.7,
    },
  },
} as const;
