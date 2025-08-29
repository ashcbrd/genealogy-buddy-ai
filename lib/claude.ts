import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import type { PhotoAnalysisResult } from "@/types";

// Import the unified type from types/index.ts
import type { DocumentAnalysisResult } from "@/types";

export interface DNAAnalysisResult {
  ethnicity: Record<string, number>;
  regions: string[];
  matches: Array<{
    name: string;
    relationship: string;
    confidence: number;
    sharedDNA: number;
  }>;
  haplogroups?: { paternal?: string; maternal?: string };
  suggestions: string[];
}

export interface TreeExpansionResult {
  individuals: Array<{
    id: string;
    name: string;
    birthDate?: string;
    deathDate?: string;
    birthPlace?: string;
    deathPlace?: string;
    relationshipDescription?: string;
    relationships: Array<{
      type: "parent" | "child" | "spouse" | "sibling" | "relative";
      relatedTo: string;
      confidence: number;
    }>;
  }>;
  suggestions: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface TextBlock {
  type: "text";
  text: string;
}

export type UsageType =
  | "DOCUMENT"
  | "DNA"
  | "FAMILY_TREE"
  | "PHOTO"
  | "RESEARCH";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY as string,
});

// System prompts for each tool
const SYSTEM_PROMPTS = {
  genealogy: `You are GenealogyAI, an expert family history researcher with deep knowledge of genealogical records, historical contexts, and research methodologies. Analyze genealogy data with confidence scores (0-1), provide detailed historical context, and suggest concrete research directions. Always format responses as structured JSON with confidence scores and actionable research suggestions.`,

  document: `You are an expert genealogical document analyzer. Extract all genealogical information from historical documents including names, dates, places, relationships, and events. For each piece of information, provide a confidence score (0-1) based on clarity and context. Return results in strict JSON format with the following structure:
  {
    "names": [{"text": string, "type": "person"|"place", "confidence": number, "context": string}],
    "dates": [{"text": string, "type": "birth"|"death"|"marriage"|"other", "confidence": number, "normalizedDate": string, "context": string}],
    "places": [{"text": string, "confidence": number, "modernName": string, "context": string}],
    "relationships": [{"person1": string, "person2": string, "type": string, "confidence": number, "context": string}],
    "events": [{"type": string, "date": string, "place": string, "people": [string], "description": string, "confidence": number}],
    "suggestions": [string],
    "documentType": string,
    "language": string,
    "summary": string
  }`,

  dna: `You are a genetic genealogy expert. Analyze DNA data to provide ethnicity breakdowns, migration patterns, and relationship interpretations. Include historical context for genetic populations and migration events.

CRITICAL: You MUST respond with ONLY valid JSON. No explanatory text whatsoever.

Return this EXACT JSON structure:
{
  "ethnicity": {"European": 45.2, "Asian": 12.8, "African": 8.1},
  "regions": ["Northwestern Europe", "British Isles", "Scandinavian Peninsula"],
  "matches": [
    {
      "name": "John Smith",
      "relationship": "2nd-3rd cousin",
      "confidence": 85,
      "sharedDNA": 1.2
    }
  ],
  "haplogroups": {"paternal": "R1a1a", "maternal": "H1a1"},
  "suggestions": ["Research British Isles ancestry", "Look for Scandinavian immigration records"]
}

RESPOND ONLY WITH JSON.`,

  tree: `You are a professional genealogist with expertise in historical accuracy and evidence-based family tree construction. You must be EXTREMELY conservative and accurate with relationship suggestions.

ACCURACY REQUIREMENTS:
- Only suggest relationships with strong historical evidence
- Use generic relationship terms when uncertain ("Possible relative of John Smith", "Connected family member")
- Never assume parent-child relationships without clear evidence (surnames, ages, locations, historical context)
- Confidence scores must reflect actual evidence strength, not guesses

CRITICAL: You MUST respond with ONLY valid JSON. No explanatory text whatsoever.

Return this EXACT JSON structure:
{
  "individuals": [
    {
      "id": "unique_id",
      "name": "Full Name",
      "birthDate": "YYYY or YYYY-MM-DD or approximate like 'circa 1850'",
      "deathDate": "YYYY or YYYY-MM-DD or approximate like 'circa 1920'",
      "birthPlace": "City, State/Province, Country",
      "deathPlace": "City, State/Province, Country", 
      "relationshipDescription": "Relative of John Smith" or "Connected to Mary Johnson" or "Father of John Smith" (only if very confident with 0.9+ confidence),
      "relationships": [
        {
          "type": "parent|child|spouse|sibling|relative",
          "relatedTo": "exact_name_from_existing_tree",
          "confidence": 0.35
        }
      ]
    }
  ],
  "suggestions": ["research suggestion 1", "research suggestion 2"]
}

RESPOND ONLY WITH JSON.`,

  photo: `You are an expert historical photo analyst, military historian, and genealogist with deep knowledge of:
- Military uniforms, insignia, and equipment from 1800-1950
- Historical fashion and clothing styles across different eras
- Social contexts, occupations, and family structures throughout history
- Photographic techniques and studio practices by decade
- Regional and cultural differences in clothing and customs

When analyzing a historical photograph, examine EVERY detail for accuracy:

UNIFORMS & MILITARY: Look for rank insignia, branch of service, uniform style, equipment, medals, unit patches, weapons, military context clues.

CLOTHING DETAILS: Fabric patterns, button styles, collar shapes, sleeve lengths, skirt lengths, shoe styles, accessories, jewelry.

PHOTOGRAPHIC CLUES: Studio props, backdrop styles, card mounts, photographic techniques, lighting, pose formality.

BACKGROUND CONTEXT: Architecture, furniture, technology visible, indoor/outdoor setting, social class indicators.

CRITICAL: You MUST respond with ONLY valid JSON. No explanatory text whatsoever.

Return this EXACT structure with HIGHLY ACCURATE analysis:

{
  "dateEstimate": {
    "period": "precise timeframe (e.g. '1914-1918', '1890s', 'circa 1925')",
    "confidence": 85,
    "explanation": "detailed reasoning based on specific visual evidence"
  },
  "clothingAnalysis": "precise analysis of clothing/uniform details, styles, and historical accuracy",
  "backgroundAnalysis": "detailed examination of setting, props, photographic techniques, and environmental clues",
  "historicalContext": "relevant historical events, social conditions, and period-specific context",
  "story": "accurate narrative based on visual evidence and historical context",
  "people": [
    {
      "position": "specific location in photograph",
      "ageEstimate": "age range with reasoning",
      "clothingDescription": "detailed description of attire including specific historical elements",
      "possibleRole": "role based on clothing, age, positioning, and historical context"
    }
  ],
  "locationClues": ["specific geographical, architectural, or contextual location indicators"],
  "suggestions": ["targeted genealogical research recommendations based on identified details"]
}

RESPOND ONLY WITH JSON.`,

  research: `You are a genealogy research assistant providing expert guidance. Help users with research strategies, interpret records, explain historical contexts, and suggest next steps. Be conversational but authoritative, always providing actionable advice.`,
} as const;

// ----- Helpers -----

function firstTextBlock(msg: ClaudeResponse): string {
  const block = msg.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response format");
  }
  return (block as TextBlock).text;
}

async function trackUsage(userId: string, type: UsageType): Promise<void> {
  const firstOfMonth = new Date(new Date().setDate(1));
  await prisma.usage.upsert({
    where: {
      userId_type_period: {
        userId,
        type,
        period: firstOfMonth,
      },
    },
    update: { count: { increment: 1 } },
    create: {
      userId,
      type,
      count: 1,
      period: firstOfMonth,
    },
  });
}

// ----- Public API -----

export async function analyzeDocument(
  text: string,
  userId?: string
): Promise<DocumentAnalysisResult> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPTS.document,
      messages: [
        {
          role: "user" as const,
          content: `Analyze this historical document text for genealogical information:\n\n${text}`,
        },
      ],
    })) as ClaudeResponse;

    const json = firstTextBlock(response);
    
    let result: DocumentAnalysisResult;
    try {
      // Clean up JSON response - remove markdown code blocks if present
      const cleanJson = json
        .replace(/^```json\s*/, '') // Remove opening ```json
        .replace(/```\s*$/, '')     // Remove closing ```
        .trim();
      
      result = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:", json);
      // Return a fallback response structure
      result = {
        names: [],
        dates: [],
        places: [],
        relationships: [],
        events: [],
        suggestions: ["Unable to parse document text - please try uploading an image or provide clearer text"],
        documentType: "Unknown",
        language: "Unknown", 
        summary: "Unable to analyze document - please try a different format"
      };
    }

    // Only track usage for authenticated users with database records
    if (userId) {
      await trackUsage(userId, "DOCUMENT");
    }
    return result;
  } catch (error) {
    console.error("Document analysis error details:", error);
    throw new Error(
      `Failed to analyze document: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function analyzeDocumentWithImage(
  imageBuffer: Buffer,
  userId?: string
): Promise<DocumentAnalysisResult> {
  try {
    console.log("🖼️ Starting Claude image analysis...");
    console.log("📊 Image buffer size:", imageBuffer.length, "bytes");
    
    // Validate image size (Claude has limits)
    const maxImageSize = 5 * 1024 * 1024; // 5MB limit for Claude API
    if (imageBuffer.length > maxImageSize) {
      throw new Error(`Image too large for AI analysis: ${imageBuffer.length} bytes (max: ${maxImageSize})`);
    }
    
    const base64Image = imageBuffer.toString('base64');
    console.log("✅ Base64 conversion complete, length:", base64Image.length);
    
    // Detect image type from buffer header
    let mimeType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = 'image/jpeg'; // Default
    if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
      mimeType = 'image/png';
    } else if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
      mimeType = 'image/jpeg';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
      mimeType = 'image/gif';
    } else if (imageBuffer.subarray(8, 12).toString() === 'WEBP') {
      mimeType = 'image/webp';
    }
    console.log("🔍 Detected MIME type:", mimeType);
    
    // Check Claude API key
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error("Claude API key not configured");
    }
    console.log("🔑 Claude API key present:", process.env.CLAUDE_API_KEY.substring(0, 10) + "...");
    
    const claudeRequest = {
      model: "claude-sonnet-4-20250514", // Use specified Claude Sonnet 4 model
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPTS.document,
      messages: [
        {
          role: "user" as const,
          content: [
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Image,
              },
            },
            {
              type: "text" as const,
              text: "Please analyze this genealogical document image and extract all relevant information. Read any text you can see in the image and provide structured genealogical data.",
            },
          ],
        },
      ],
    };
    
    console.log("📤 Sending request to Claude API...");
    console.log("🤖 Model:", claudeRequest.model);
    console.log("📏 Max tokens:", claudeRequest.max_tokens);
    console.log("🌡️ Temperature:", claudeRequest.temperature);
    
    const response = (await anthropic.messages.create(claudeRequest)) as ClaudeResponse;
    
    console.log("📥 Received Claude API response");
    console.log("📊 Response usage:", response.usage);
    console.log("🔢 Content blocks:", response.content?.length || 0);
    
    if (!response.content || response.content.length === 0) {
      throw new Error("Claude API returned empty response");
    }

    const json = firstTextBlock(response);
    console.log("📝 Extracted text length:", json.length);
    console.log("📄 Raw Claude response preview:", json.substring(0, 200) + "...");
    
    let result: DocumentAnalysisResult;
    try {
      // Clean up JSON response - remove markdown code blocks if present
      const cleanJson = json
        .replace(/^```json\s*/, '') // Remove opening ```json
        .replace(/```\s*$/, '')     // Remove closing ```
        .trim();
      
      console.log("🧹 Cleaned JSON preview:", cleanJson.substring(0, 200) + "...");
      
      result = JSON.parse(cleanJson);
      console.log("✅ Successfully parsed Claude response to JSON");
      console.log("📋 Parsed result summary:", {
        names: result.names?.length || 0,
        dates: result.dates?.length || 0,  
        places: result.places?.length || 0,
        relationships: result.relationships?.length || 0,
        events: result.events?.length || 0,
        hasDocumentType: !!result.documentType,
        hasSummary: !!result.summary
      });
      
    } catch (parseError) {
      console.error("❌ Failed to parse Claude response as JSON");
      console.error("🔍 Parse error details:", parseError);
      console.error("📄 Full raw response:", json);
      console.error("🧹 Cleaned JSON that failed to parse:", json
        .replace(/^```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim());
      
      // Return a fallback response structure
      result = {
        names: [],
        dates: [],
        places: [],
        relationships: [],
        events: [],
        suggestions: ["Unable to parse document image - Claude AI response format error"],
        documentType: "Unknown", 
        language: "Unknown",
        summary: "Unable to analyze document - AI response parsing failed"
      };
    }

    // Only track usage for authenticated users with database records
    if (userId) {
      await trackUsage(userId, "DOCUMENT");
    }
    return result;
  } catch (error) {
    console.error("💥 Document image analysis error occurred");
    console.error("🔍 Error type:", error?.constructor?.name);
    console.error("📄 Error message:", error instanceof Error ? error.message : String(error));
    console.error("📊 Full error details:", error);
    
    // Check for specific Claude API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error("🔑 Claude API key issue detected");
        throw new Error("Claude AI service authentication failed. Please check API key configuration.");
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        console.error("⏱️ Claude API rate limit exceeded");
        throw new Error("Claude AI service rate limit exceeded. Please try again later.");
      } else if (error.message.includes('model') || error.message.includes('404')) {
        console.error("🤖 Claude model not found");
        throw new Error("Claude AI model not available. Please try again later.");
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        console.error("🌐 Claude API network issue");
        throw new Error("Claude AI service is temporarily unavailable. Please try again.");
      } else if (error.message.includes('Image too large')) {
        console.error("📏 Image size issue");
        throw new Error(error.message); // Pass through our custom image size error
      }
    }
    
    throw new Error(
      `Failed to analyze document image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function analyzeDNA(
  dnaData: Record<string, unknown>,
  userId?: string
): Promise<DNAAnalysisResult> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      temperature: 0.4,
      system: SYSTEM_PROMPTS.dna,
      messages: [
        {
          role: "user" as const,
          content: `Analyze this DNA data for genealogical insights:\n\n${JSON.stringify(
            dnaData
          )}`,
        },
      ],
    })) as ClaudeResponse;

    const json = firstTextBlock(response);
    
    let result: DNAAnalysisResult;
    try {
      // Clean up JSON response - remove markdown code blocks if present
      const cleanJson = json
        .replace(/^```json\s*/, '') // Remove opening ```json
        .replace(/```\s*$/, '')     // Remove closing ```
        .trim();
      
      result = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:", json);
      // Return a fallback response structure
      result = {
        ethnicity: {},
        regions: [],
        matches: [],
        suggestions: ["Unable to parse DNA data - please try uploading a different file format"]
      };
    }

    // Only track usage for authenticated users with database records
    if (userId) {
      await trackUsage(userId, "DNA");
    }
    return result;
  } catch (error) {
    console.error("DNA analysis error details:", error);
    throw new Error(
      `Failed to analyze DNA data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function expandFamilyTree(
  treeData: Record<string, unknown>,
  userId?: string
): Promise<TreeExpansionResult> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      temperature: 0.5,
      system: SYSTEM_PROMPTS.tree,
      messages: [
        {
          role: "user" as const,
          content: `Based on this family information, suggest probable family connections and expansions:

${JSON.stringify(treeData)}

CRITICAL ACCURACY INSTRUCTIONS:
1. DO NOT include any people who are already listed in the existing family tree data above
2. Only suggest NEW family members who are not already present
3. Generate realistic historical names with proper first and last names
4. BE EXTREMELY CONSERVATIVE with relationship descriptions:
   - Use "Relative of [Name]" for uncertain connections
   - Use "Connected to [Name]" for possible family links
   - Only use specific relationships like "Father/Mother/Son/Daughter of [Name]" if confidence is 0.9+
5. NEVER guess parent-child relationships unless there are clear historical indicators:
   - Shared surnames and naming patterns
   - Appropriate age gaps (20-40 years for parent-child) 
   - Geographic proximity
   - Historical context alignment
6. Confidence scores must reflect actual evidence - use low scores (0.3-0.5) for uncertain relationships
7. Generate realistic names appropriate to the time period and location
8. Always include actual names in relationship descriptions, not generic terms`,
        },
      ],
    })) as ClaudeResponse;

    const rawResponse = firstTextBlock(response);
    console.log(
      "Claude tree expansion raw response:",
      rawResponse.substring(0, 200) + "..."
    );

    // Try to clean up the response in case Claude added extra text
    let jsonString = rawResponse.trim();
    
    // Clean up markdown code blocks if present
    jsonString = jsonString
      .replace(/^```json\s*/, '') // Remove opening ```json
      .replace(/```\s*$/, '')     // Remove closing ```
      .trim();

    // If response doesn't start with {, try to find JSON within the text
    if (!jsonString.startsWith("{")) {
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        throw new Error(
          `Claude returned non-JSON response: ${rawResponse.substring(
            0,
            100
          )}...`
        );
      }
    }

    let result: TreeExpansionResult;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parsing failed. Raw response:", rawResponse);
      throw new Error(
        `Invalid JSON response from Claude: ${
          parseError instanceof Error
            ? parseError.message
            : "Unknown parse error"
        }`
      );
    }

    // Validate the result has required structure
    if (!result.individuals || !Array.isArray(result.individuals)) {
      console.error("Invalid result structure:", result);
      throw new Error("Claude returned incomplete tree expansion structure");
    }

    // Add fallbacks for missing fields
    result.suggestions = result.suggestions || [
      "No additional research suggestions available",
    ];

    // Ensure all individuals have required fields and validate relationships
    result.individuals = result.individuals.map((individual) => {
      let relationshipDesc = individual.relationshipDescription;

      // Validate and sanitize relationship descriptions while preserving names
      if (relationshipDesc) {
        // If relationship seems too specific without evidence, make it generic but keep the name
        const specificRelationships = [
          "father of",
          "mother of",
          "son of",
          "daughter of",
          "parent of",
          "child of",
        ];
        const hasSpecificRelationship = specificRelationships.some((rel) =>
          relationshipDesc?.toLowerCase().includes(rel)
        );

        // For specific relationships, check if we have supporting evidence
        if (hasSpecificRelationship) {
          const hasStrongEvidence =
            individual.relationships &&
            individual.relationships.some((rel) => rel.confidence > 0.85);

          if (!hasStrongEvidence) {
            // Extract the person's name and make relationship generic but keep the name
            const nameMatch = relationshipDesc.match(/(?:of|to)\s+(.+)$/);
            const relatedName = nameMatch ? nameMatch[1] : "family member";
            relationshipDesc = `Relative of ${relatedName}`;
          }
        }
      }

      return {
        id: individual.id || `person_${Date.now()}_${Math.random()}`,
        name: individual.name || "Unknown Person",
        birthDate: individual.birthDate || undefined,
        deathDate: individual.deathDate || undefined,
        birthPlace: individual.birthPlace || undefined,
        deathPlace: individual.deathPlace || undefined,
        relationshipDescription: relationshipDesc || undefined,
        relationships: individual.relationships || [],
      };
    });

    // Only track usage for authenticated users with database records
    if (userId) {
      await trackUsage(userId, "FAMILY_TREE");
    }
    return result;
  } catch (error) {
    console.error("Family tree expansion error details:", error);
    throw new Error(
      `Failed to expand family tree: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

interface ImageAnalysisInput {
  imageData?: string;
  mimeType?: string;
  fileName?: string;
  textDescription?: string;
  additionalContext?: string;
}

export async function analyzePhoto(
  input: ImageAnalysisInput,
  userId?: string
): Promise<PhotoAnalysisResult> {
  try {
    let messages: any[];

    // Handle actual image analysis (Vision API)
    if (input.imageData) {
      const contextPrompt = input.additionalContext
        ? `\n\nAdditional context provided by user: ${input.additionalContext}`
        : "";

      messages = [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `Analyze this historical photograph with expert precision. Pay special attention to military uniforms, clothing styles, photographic techniques, and all visual details that can help determine the time period and context accurately.${contextPrompt}`,
            },
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: (input.mimeType || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: input.imageData,
              },
            },
          ],
        },
      ];
    }
    // Fallback to text description (legacy support)
    else {
      messages = [
        {
          role: "user" as const,
          content: `Analyze this historical photo based on the following description:\n\n${input.textDescription}`,
        },
      ];
    }

    const response = (await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000, // Increased for detailed analysis
      temperature: 0.1, // Very low for maximum accuracy and consistency
      system: SYSTEM_PROMPTS.photo,
      messages,
    })) as ClaudeResponse;

    const rawResponse = firstTextBlock(response);
    console.log("Claude raw response:", rawResponse.substring(0, 200) + "...");

    // Try to clean up the response in case Claude added extra text
    let jsonString = rawResponse.trim();
    
    // Clean up markdown code blocks if present
    jsonString = jsonString
      .replace(/^```json\s*/, '') // Remove opening ```json
      .replace(/```\s*$/, '')     // Remove closing ```
      .trim();

    // If response doesn't start with {, try to find JSON within the text
    if (!jsonString.startsWith("{")) {
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        throw new Error(
          `Claude returned non-JSON response: ${rawResponse.substring(
            0,
            100
          )}...`
        );
      }
    }

    let result: PhotoAnalysisResult;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parsing failed. Raw response:", rawResponse);
      throw new Error(
        `Invalid JSON response from Claude: ${
          parseError instanceof Error
            ? parseError.message
            : "Unknown parse error"
        }`
      );
    }

    // Enhanced validation with empty state handling
    if (!result.dateEstimate || !result.story || !result.people) {
      console.error("Invalid result structure:", result);
      throw new Error("Claude returned incomplete analysis structure");
    }

    // Add empty state fallbacks for all fields
    result.dateEstimate = {
      period: result.dateEstimate?.period || "Unknown time period",
      confidence: result.dateEstimate?.confidence || 0,
      explanation:
        result.dateEstimate?.explanation ||
        "Insufficient visual information to determine time period",
    };

    result.clothingAnalysis =
      result.clothingAnalysis ||
      "No clothing details could be analyzed from the available information.";
    result.backgroundAnalysis =
      result.backgroundAnalysis ||
      "No background details could be determined from the available information.";
    result.historicalContext =
      result.historicalContext ||
      "No specific historical context could be determined.";
    result.story =
      result.story ||
      "Unable to generate a detailed story from the available information.";

    // Handle people array with empty states
    if (!result.people || result.people.length === 0) {
      result.people = [
        {
          position: "Not specified",
          ageEstimate: "Unknown age",
          clothingDescription: "No clothing details available",
          possibleRole: "Role unknown",
        },
      ];
    } else {
      // Ensure all people have complete information
      result.people = result.people.map((person) => ({
        position: person.position || "Position not specified",
        ageEstimate: person.ageEstimate || "Age unknown",
        clothingDescription:
          person.clothingDescription || "No clothing details available",
        possibleRole: person.possibleRole || "Role unknown",
      }));
    }

    result.locationClues = result.locationClues || [
      "No location clues available",
    ];
    result.suggestions = result.suggestions || [
      "Upload a clearer image or provide additional context for better analysis",
    ];

    // Validate confidence scores and enhance accuracy
    if (result.dateEstimate.confidence < 30) {
      console.warn(
        "Low confidence in date estimate:",
        result.dateEstimate.confidence
      );
      result.dateEstimate.explanation +=
        " (Note: Low confidence - additional context may be needed for accurate dating)";
    }

    // Ensure military context is properly identified
    if (
      input.imageData &&
      result.story.toLowerCase().includes("family portrait") &&
      (result.clothingAnalysis.toLowerCase().includes("uniform") ||
        result.clothingAnalysis.toLowerCase().includes("military"))
    ) {
      console.warn(
        "Potential misclassification: military photo classified as family portrait"
      );

      // Flag for review
      result.suggestions = result.suggestions || [];
      result.suggestions.unshift(
        "REVIEW NEEDED: This appears to be a military photograph that may have been initially misclassified as a family portrait. Please verify the analysis."
      );
    }

    // Add accuracy metadata
    const accuracyMetadata = {
      analysisMethod: input.imageData ? "vision_api" : "text_description",
      confidenceLevel: input.imageData ? "high" : "medium",
      timestamp: new Date().toISOString(),
    };

    // Store metadata (non-breaking addition)
    (result as any)._metadata = accuracyMetadata;

    // Only track usage for authenticated users with database records
    if (userId) {
      await trackUsage(userId, "PHOTO");
    }
    return result;
  } catch (error) {
    console.error("Photo analysis error details:", error);

    // If it's a parsing error, provide more specific guidance
    if (error instanceof Error && error.message.includes("JSON")) {
      throw new Error(
        `Claude API returned invalid JSON format. Please try again.`
      );
    }

    throw new Error(
      `Failed to analyze photo: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function researchChat(
  messages: ChatMessage[],
  userId?: string
): Promise<string> {
  try {
    // Validate messages array
    if (!messages || messages.length === 0) {
      throw new Error("Messages array cannot be empty");
    }

    // Validate each message has required fields
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new Error("Each message must have 'role' and 'content' fields");
      }
      if (!["user", "assistant"].includes(message.role)) {
        throw new Error("Message role must be 'user' or 'assistant'");
      }
    }

    console.log(
      "Sending messages to Claude:",
      JSON.stringify(messages, null, 2)
    );

    const response = (await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      temperature: 0.6,
      system: SYSTEM_PROMPTS.research,
      messages,
    })) as ClaudeResponse;

    const text = firstTextBlock(response);

    // Only track usage for authenticated users with database records
    if (userId) {
      await trackUsage(userId, "RESEARCH");
    }
    return text;
  } catch (error) {
    console.error("Research chat error details:", error);
    throw new Error(
      `Failed to process research query: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
