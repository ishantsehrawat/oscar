/**
 * Migration script to:
 * 1. Convert topic (string) to topics (string[]) by splitting on " / "
 * 2. Find and populate YouTube links from takeuforward channel
 *
 * This script:
 * - Reads the current JSON file
 * - Migrates the data structure
 * - Updates the JSON file
 * - Optionally updates Firestore
 *
 * Run with: npm run migrate
 * Or directly: npx tsx scripts/migrate-questions.ts
 */

import * as fs from "fs";
import * as path from "path";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

// Use the same Firebase config as the app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCRMB1K12g0tz8c8OmCtboMdP3OUNMcz2E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "oscar-51ecf.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "oscar-51ecf",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oscar-51ecf.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1050295652702",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1050295652702:web:efaa78a1ced6b8c47abfcf",
};

interface OldQuestion {
  title: string;
  topic: string; // Old format
  difficulty: "Easy" | "Medium" | "Hard";
  youtubeLink: string | null;
  leetcodeLink: string;
  order: number;
}

interface NewQuestion {
  title: string;
  topics: string[]; // New format
  difficulty: "Easy" | "Medium" | "Hard";
  youtubeLink: string | null;
  leetcodeLink: string;
  order: number;
}

/**
 * Convert topic string to topics array by splitting on " / "
 */
function convertTopicToTopics(topic: string): string[] {
  if (!topic) return [];
  return topic.split(" / ").map((t) => t.trim()).filter((t) => t.length > 0);
}

/**
 * Search for YouTube video from takeuforward channel using YouTube Data API
 * Set YOUTUBE_API_KEY environment variable to enable this feature
 */
async function findYouTubeLink(
  title: string,
  leetcodeLink: string
): Promise<string | null> {
  try {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const takeuforwardChannelId = "UCJskGeByzRDPvmk8gYziuRg"; // @takeUforward channel
    
    if (!youtubeApiKey) {
      console.log(`  ⚠️  YouTube API key not set. Set YOUTUBE_API_KEY env var to enable search.`);
      console.log(`  📝 Get API key: https://console.cloud.google.com/apis/credentials`);
      return null;
    }

    // Clean title for search
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    
    // Try multiple search patterns
    const searchQueries = [
      `${title} striver`,
      `striver ${title}`,
      `${cleanTitle} takeuforward`,
      `${title} takeuforward sde sheet`,
    ];

    console.log(`  🔍 Searching YouTube: "${searchQueries[0]}"`);
    
    // Use YouTube Data API v3 to search
    for (const query of searchQueries) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&channelId=${takeuforwardChannelId}&maxResults=5&key=${youtubeApiKey}`;
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
          if (response.status === 403) {
            console.log(`  ⚠️  YouTube API quota exceeded or invalid key`);
            return null;
          }
          continue;
        }
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          // Find the best match (usually the first one)
          const video = data.items[0];
          const videoId = video.id.videoId;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          
          console.log(`  ✅ Found: ${video.snippet.title}`);
          console.log(`  🔗 URL: ${videoUrl}`);
          
          return videoUrl;
        }
      } catch (apiError: any) {
        console.log(`  ⚠️  API error for query "${query}": ${apiError.message}`);
        continue;
      }
      
      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    
    console.log(`  ❌ No YouTube video found for "${title}"`);
    return null;
  } catch (error) {
    console.error(`  ❌ Error searching for YouTube link: ${error}`);
    return null;
  }
}

/**
 * Migrate questions from old format to new format
 */
async function migrateQuestions(
  updateFirestore: boolean = false
): Promise<void> {
  try {
    const dataPath = path.join(__dirname, "../data/strivers-sde-sheet.json");

    if (!fs.existsSync(dataPath)) {
      console.error(`❌ Data file not found at ${dataPath}`);
      process.exit(1);
    }

    console.log("📖 Reading questions from JSON file...");
    const questionsData = JSON.parse(
      fs.readFileSync(dataPath, "utf-8")
    ) as OldQuestion[];

    console.log(`Found ${questionsData.length} questions to migrate`);

    // Migrate each question
    const migratedQuestions: NewQuestion[] = [];
    let topicsConverted = 0;
    let youtubeLinksFound = 0;

    for (let i = 0; i < questionsData.length; i++) {
      const question = questionsData[i];
      console.log(`\n[${i + 1}/${questionsData.length}] Migrating: ${question.title}`);

      // Convert topic to topics
      const topics = convertTopicToTopics(question.topic);
      if (topics.length > 1 || (topics.length === 1 && topics[0] !== question.topic)) {
        topicsConverted++;
        console.log(`  Topic: "${question.topic}" -> Topics: [${topics.join(", ")}]`);
      }

      // Find YouTube link if not already present
      let youtubeLink = question.youtubeLink;
      if (!youtubeLink) {
        youtubeLink = await findYouTubeLink(question.title, question.leetcodeLink);
        if (youtubeLink) {
          youtubeLinksFound++;
          console.log(`  Found YouTube link: ${youtubeLink}`);
        } else {
          console.log(`  No YouTube link found (will remain null)`);
        }
      } else {
        console.log(`  YouTube link already exists: ${youtubeLink}`);
      }

      migratedQuestions.push({
        title: question.title,
        topics,
        difficulty: question.difficulty,
        youtubeLink,
        leetcodeLink: question.leetcodeLink,
        order: question.order,
      });

      // Add a small delay to avoid rate limiting
      if (i < questionsData.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Write migrated data back to JSON file
    console.log("\n💾 Writing migrated data to JSON file...");
    const outputPath = path.join(__dirname, "../data/strivers-sde-sheet.json");
    fs.writeFileSync(outputPath, JSON.stringify(migratedQuestions, null, 2));
    console.log(`✅ Migrated data written to ${outputPath}`);

    console.log("\n📊 Migration Summary:");
    console.log(`   Total questions: ${questionsData.length}`);
    console.log(`   Topics converted: ${topicsConverted}`);
    console.log(`   YouTube links found: ${youtubeLinksFound}`);

    // Update Firestore if requested
    if (updateFirestore) {
      console.log("\n🔥 Updating Firestore...");
      await updateFirestoreQuestions(migratedQuestions);
    } else {
      console.log("\n💡 To update Firestore, run with --update-firestore flag");
      console.log("   Example: npm run migrate -- --update-firestore");
    }
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
}

/**
 * Update questions in Firestore with new format
 */
async function updateFirestoreQuestions(
  questions: NewQuestion[]
): Promise<void> {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("🔍 Fetching existing questions from Firestore...");
    const questionsRef = collection(db, "questions");
    const snapshot = await getDocs(questionsRef);

    const questionsMap = new Map<string, string>(); // title -> docId
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.title) {
        questionsMap.set(data.title, doc.id);
      }
    });

    console.log(`Found ${questionsMap.size} questions in Firestore`);

    let updated = 0;
    let notFound = 0;

    for (const question of questions) {
      const docId = questionsMap.get(question.title);
      if (docId) {
        const docRef = doc(db, "questions", docId);
        await updateDoc(docRef, {
          topics: question.topics,
          youtubeLink: question.youtubeLink,
          updatedAt: Timestamp.now(),
        });
        updated++;
        console.log(`✅ Updated: ${question.title}`);
      } else {
        notFound++;
        console.log(`⚠️  Not found in Firestore: ${question.title}`);
      }
    }

    console.log(`\n✅ Firestore update complete:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found: ${notFound}`);
  } catch (error) {
    console.error("❌ Error updating Firestore:", error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const updateFirestore = args.includes("--update-firestore") || args.includes("-f");

// Run migration
migrateQuestions(updateFirestore).catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

