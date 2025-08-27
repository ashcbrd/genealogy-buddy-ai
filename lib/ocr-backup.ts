// BACKUP: Original Google Cloud Vision implementation
// This file is kept as backup in case Google Vision needs to be restored

import * as vision from "@google-cloud/vision";
import { logger } from "./logger";

/**
 * OCR utility for extracting text from images and documents
 * Uses Google Cloud Vision API for high-quality text recognition
 */

// Initialize Google Vision client
const visionClient = new vision.ImageAnnotatorClient({
  // Option 1: Use service account JSON file
  // keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  
  // Option 2: Use environment variables directly (preferred for production)
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY ? {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
    project_id: process.env.GOOGLE_PROJECT_ID, // Ensure project ID is explicitly set
  } : undefined,
});

export interface OCRResult {
  text: string;
  confidence: number;
  pages?: OCRPage[];
  blocks?: OCRBlock[];
  words?: OCRWord[];
  detectedLanguages?: string[];
}

export interface OCRPage {
  width: number;
  height: number;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  paragraphs: OCRParagraph[];
}

export interface OCRParagraph {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract text from an image file
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  userId?: string
): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    logger.info("Starting OCR text extraction", { userId });

    // Call Google Vision API
    const [result] = await visionClient.textDetection({
      image: {
        content: imageBuffer,
      },
    });

    const detections = result.textAnnotations || [];
    
    if (!detections.length) {
      logger.warn("No text detected in image", { userId });
      return {
        text: "",
        confidence: 0,
        detectedLanguages: [],
      };
    }

    // First detection contains the full text
    const fullText = detections[0]?.description || "";
    
    // Calculate average confidence from individual words
    const wordConfidences = detections.slice(1).map(detection => 
      detection.confidence || 0
    );
    const averageConfidence = wordConfidences.length > 0 
      ? wordConfidences.reduce((sum, conf) => sum + conf, 0) / wordConfidences.length 
      : 0;

    // Extract detected languages
    const detectedLanguages = result.textAnnotations?.[0]?.locale 
      ? [result.textAnnotations[0].locale]
      : [];

    const duration = Date.now() - startTime;
    
    logger.info("OCR text extraction completed", { 
      userId,
      duration,
      textLength: fullText.length,
      confidence: averageConfidence,
      languages: detectedLanguages,
    });

    return {
      text: fullText,
      confidence: averageConfidence,
      detectedLanguages,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("OCR text extraction failed", error as Error, {
      userId,
      duration,
    });
    throw new Error("Failed to extract text from image");
  }
}

// ... rest of the original Google Vision implementation