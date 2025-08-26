import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";

// Claude-specific types
export interface DocumentAnalysisResult {
  names: Array<{ text: string; type: 'person' | 'place'; confidence: number }>;
  dates: Array<{ text: string; type: 'birth' | 'death' | 'marriage' | 'other'; confidence: number }>;
  places: Array<{ text: string; confidence: number }>;
  relationships: Array<{ person1: string; person2: string; type: string; confidence: number }>;
  suggestions: string[];
}

export interface DNAAnalysisResult {
  ethnicity: Record<string, number>;
  regions: string[];
  matches: Array<{ name: string; relationship: string; confidence: number; sharedDNA: number }>;
  haplogroups?: { paternal?: string; maternal?: string };
  suggestions: string[];
}

export interface PhotoAnalysisResult {
  individuals: Array<{
    description: string;
    estimatedAge?: number;
    gender?: string;
    confidence: number;
    relationships?: string[];
  }>;
  timeEra?: string;
  location?: string;
  occasion?: string;
  suggestions: string[];
}

export interface TreeExpansionResult {
  individuals: Array<{
    id: string;
    name: string;
    birthDate?: string;
    deathDate?: string;
    birthPlace?: string;
    relationships: Array<{
      type: 'parent' | 'child' | 'spouse';
      relatedTo: string;
      confidence: number;
    }>;
  }>;
  suggestions: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
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
  type: 'text';
  text: string;
}

export type UsageType = 'DOCUMENT' | 'DNA' | 'FAMILY_TREE' | 'PHOTO' | 'RESEARCH';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY as string,
});

// System prompts for each tool
const SYSTEM_PROMPTS = {
  genealogy: `You are GenealogyAI, an expert family history researcher with deep knowledge of genealogical records, historical contexts, and research methodologies. Analyze genealogy data with confidence scores (0-1), provide detailed historical context, and suggest concrete research directions. Always format responses as structured JSON with confidence scores and actionable research suggestions.`,

  document: `You are an expert genealogical document analyzer. Extract all genealogical information from historical documents including names, dates, places, and relationships. For each piece of information, provide a confidence score (0-1) based on clarity and context. Return results in strict JSON format with the following structure:
  {
    "names": [{"text": string, "type": "person"|"place", "confidence": number}],
    "dates": [{"text": string, "type": "birth"|"death"|"marriage"|"other", "confidence": number}],
    "places": [{"text": string, "confidence": number}],
    "relationships": [{"person1": string, "person2": string, "type": string, "confidence": number}],
    "suggestions": [string]
  }`,

  dna: `You are a genetic genealogy expert. Analyze DNA data to provide ethnicity breakdowns, migration patterns, and relationship interpretations. Include historical context for genetic populations and migration events. Return JSON with confidence scores for all interpretations.`,

  tree: `You are a family tree construction expert. Based on provided information, suggest probable family connections with confidence scores. Consider historical naming patterns, geographic proximity, and common genealogical practices. Return structured family tree data with relationship probabilities.`,

  photo: `You are a historical photo analyst and storyteller. Analyze photographs for genealogical clues including time period estimation based on clothing and technology, identify historical context, and create engaging narratives about the subjects. Return detailed JSON analysis.`,

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
  userId: string
): Promise<DocumentAnalysisResult> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPTS.document,
      messages: [
        {
          role: "user",
          content: `Analyze this historical document text for genealogical information:\n\n${text}`,
        },
      ],
    })) as ClaudeResponse;

    const json = firstTextBlock(response);
    const result: DocumentAnalysisResult = JSON.parse(json);

    await trackUsage(userId, "DOCUMENT");
    return result;
  } catch {
    throw new Error("Failed to analyze document");
  }
}

export async function analyzeDNA(
  dnaData: Record<string, unknown>,
  userId: string
): Promise<DNAAnalysisResult> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2500,
      temperature: 0.4,
      system: SYSTEM_PROMPTS.dna,
      messages: [
        {
          role: "user",
          content: `Analyze this DNA data for genealogical insights:\n\n${JSON.stringify(
            dnaData
          )}`,
        },
      ],
    })) as ClaudeResponse;

    const json = firstTextBlock(response);
    const result: DNAAnalysisResult = JSON.parse(json);

    await trackUsage(userId, "DNA");
    return result;
  } catch {
    throw new Error("Failed to analyze DNA data");
  }
}

export async function expandFamilyTree(
  treeData: Record<string, unknown>,
  userId: string
): Promise<TreeExpansionResult> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 3000,
      temperature: 0.5,
      system: SYSTEM_PROMPTS.tree,
      messages: [
        {
          role: "user",
          content: `Based on this family information, suggest probable family connections and expansions:\n\n${JSON.stringify(
            treeData
          )}`,
        },
      ],
    })) as ClaudeResponse;

    const json = firstTextBlock(response);
    const result: TreeExpansionResult = JSON.parse(json);

    await trackUsage(userId, "FAMILY_TREE");
    return result;
  } catch {
    throw new Error("Failed to expand family tree");
  }
}

export async function analyzePhoto(
  photoDescription: string,
  userId: string
): Promise<PhotoAnalysisResult> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      temperature: 0.7,
      system: SYSTEM_PROMPTS.photo,
      messages: [
        {
          role: "user",
          content: `Analyze this historical family photo and provide genealogical insights:\n\n${photoDescription}`,
        },
      ],
    })) as ClaudeResponse;

    const json = firstTextBlock(response);
    const result: PhotoAnalysisResult = JSON.parse(json);

    await trackUsage(userId, "PHOTO");
    return result;
  } catch {
    throw new Error("Failed to analyze photo");
  }
}

export async function researchChat(
  messages: ChatMessage[],
  userId: string
): Promise<string> {
  try {
    const response = (await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1500,
      temperature: 0.6,
      system: SYSTEM_PROMPTS.research,
      messages,
    })) as ClaudeResponse;

    const text = firstTextBlock(response);

    await trackUsage(userId, "RESEARCH");
    return text;
  } catch {
    throw new Error("Failed to process research query");
  }
}
