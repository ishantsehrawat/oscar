/**
 * Seed script to populate and update Firestore with Striver's SDE Sheet questions
 *
 * This script reads questions from a JSON file and:
 * - Adds new questions that don't exist (matched by title)
 * - Updates existing questions if they already exist
 *
 * PREREQUISITES:
 * 1. Firestore database must be created in Firebase Console
 *    - Go to Firebase Console > Your Project > Firestore Database
 *    - Click "Create database" if not already created
 *    - Choose "Start in test mode" for development
 *
 * 2. Firestore Security Rules (for development):
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /{document=**} {
 *          allow read, write: if true;
 *        }
 *      }
 *    }
 *
 * The JSON should be structured as:
 * [
 *   {
 *     "title": "Question Title",
 *     "topic": "Arrays",
 *     "difficulty": "Easy",
 *     "youtubeLink": "https://youtube.com/...",
 *     "leetcodeLink": "https://leetcode.com/...",
 *     "order": 1
 *   },
 *   ...
 * ]
 *
 * Run with: npm run seed
 * Or directly: npx tsx scripts/seed-questions.ts
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  writeBatch,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import { Question } from "../src/types/question";

// Use the same Firebase config as the app
// Try environment variables first, then fallback to hardcoded config
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyCRMB1K12g0tz8c8OmCtboMdP3OUNMcz2E",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "oscar-51ecf.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "oscar-51ecf",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "oscar-51ecf.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1050295652702",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:1050295652702:web:efaa78a1ced6b8c47abfcf",
};

async function seedQuestions() {
  try {
    // Validate config
    if (!firebaseConfig.projectId) {
      console.error("❌ Error: Firebase projectId is required");
      process.exit(1);
    }

    console.log(
      `🔧 Initializing Firebase with project: ${firebaseConfig.projectId}`
    );

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Test Firestore connection
    console.log("🔍 Testing Firestore connection...");
    try {
      // Just try to access the collection (this will fail if Firestore isn't set up)
      const testRef = collection(db, "questions");
      // Try a simple query - limit to 1 to avoid reading all docs
      const testQuery = query(testRef);
      await getDocs(testQuery);
      console.log("✅ Firestore connection successful");
    } catch (testError: any) {
      console.error("❌ Firestore connection test failed:", testError.message);
      console.error("\n⚠️  SETUP REQUIRED:");
      console.error(
        "   1. Go to Firebase Console: https://console.firebase.google.com/"
      );
      console.error("   2. Select your project: " + firebaseConfig.projectId);
      console.error("   3. Go to Firestore Database");
      console.error("   4. Click 'Create database' if not already created");
      console.error("   5. Choose 'Start in test mode' (for development)");
      console.error("   6. Select a location for your database");
      console.error("\n   Security Rules (for development):");
      console.error("   service cloud.firestore {");
      console.error("     match /databases/{database}/documents {");
      console.error("       match /{document=**} {");
      console.error("         allow read, write: if true;");
      console.error("       }");
      console.error("     }");
      console.error("   }");
      throw testError;
    }

    // Read questions from JSON file
    const dataPath = path.join(__dirname, "../data/strivers-sde-sheet.json");

    if (!fs.existsSync(dataPath)) {
      console.error(`Data file not found at ${dataPath}`);
      console.log(
        "Please create data/strivers-sde-sheet.json with the questions data."
      );
      process.exit(1);
    }

    const questionsData = JSON.parse(
      fs.readFileSync(dataPath, "utf-8")
    ) as Omit<Question, "id">[];

    console.log(`Found ${questionsData.length} questions to seed/update`);

    // Get all existing questions to check for updates
    const questionsRef = collection(db, "questions");
    const existingQuestionsSnapshot = await getDocs(questionsRef);
    const existingQuestionsMap = new Map<string, string>(); // title -> docId

    existingQuestionsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.title) {
        existingQuestionsMap.set(data.title, doc.id);
      }
    });

    console.log(
      `Found ${existingQuestionsMap.size} existing questions in Firestore`
    );

    let addedCount = 0;
    let updatedCount = 0;

    // Process questions one by one with better error handling
    for (let i = 0; i < questionsData.length; i++) {
      const question = questionsData[i];

      try {
        const existingDocId = existingQuestionsMap.get(question.title);

        // Clean the question data - ensure all values are proper types
        // Handle both old format (topic) and new format (topics)
        const cleanQuestion: Record<string, any> = {
          title: String(question.title || ""),
          difficulty: String(question.difficulty || ""),
          leetcodeLink: String(question.leetcodeLink || ""),
          order: Number(question.order || 0),
        };

        // Handle topics array (new format) or topic string (old format for migration)
        if (
          (question as any).topics &&
          Array.isArray((question as any).topics)
        ) {
          // New format: topics array
          cleanQuestion.topics = (question as any).topics
            .map((t: any) => String(t))
            .filter((t: string) => t.length > 0);
        } else if ((question as any).topic) {
          // Old format: topic string - convert to topics array
          const topicStr = String((question as any).topic || "");
          cleanQuestion.topics = topicStr
            .split(" / ")
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);
        } else {
          cleanQuestion.topics = [];
        }

        // Handle youtubeLink - Firestore accepts null
        cleanQuestion.youtubeLink =
          question.youtubeLink !== null && question.youtubeLink !== undefined
            ? String(question.youtubeLink)
            : null;

        if (existingDocId) {
          // Update existing question
          const docRef = doc(db, "questions", existingDocId);
          await updateDoc(docRef, {
            ...cleanQuestion,
            updatedAt: Timestamp.now(),
          });
          updatedCount++;
        } else {
          // Add new question using addDoc
          await addDoc(collection(db, "questions"), {
            ...cleanQuestion,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          addedCount++;
        }

        if ((i + 1) % 10 === 0) {
          console.log(
            `Processed ${i + 1}/${questionsData.length} questions...`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing question "${question.title}" (${i + 1}/${
            questionsData.length
          }):`,
          error
        );
        // Continue with next question instead of failing completely
      }
    }

    console.log(`\n✅ Successfully processed all questions!`);
    console.log(`   Added: ${addedCount} new questions`);
    console.log(`   Updated: ${updatedCount} existing questions`);

    // Sync sheets after seeding
    console.log("\n🔄 Syncing sheets...");
    const allSheets = new Set<string>();
    questionsData.forEach((q) => {
      if ((q as any).sheets && Array.isArray((q as any).sheets)) {
        (q as any).sheets.forEach((s: string) => allSheets.add(s));
      } else if ((q as any).sheet) {
        allSheets.add((q as any).sheet);
      } else {
        allSheets.add("Striver SDE Sheet");
      }
    });

    // Sync each sheet
    for (const sheetName of allSheets) {
      try {
        // Get all questions for this sheet
        const sheetQuestionsQuery = query(
          collection(db, "questions"),
          where("sheets", "array-contains", sheetName),
          orderBy("order", "asc")
        );
        const sheetQuestionsSnapshot = await getDocs(sheetQuestionsQuery);
        const questionIds = sheetQuestionsSnapshot.docs.map((doc) => doc.id);

        // Create or update sheet document
        const sheetsRef = collection(db, "sheets");
        const existingSheetQuery = query(
          sheetsRef,
          where("name", "==", sheetName)
        );
        const existingSheetSnapshot = await getDocs(existingSheetQuery);

        if (existingSheetSnapshot.empty) {
          // Create new sheet
          const newSheetRef = doc(sheetsRef);
          await setDoc(newSheetRef, {
            name: sheetName,
            questionIds,
            totalQuestions: questionIds.length,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          console.log(
            `   ✅ Created sheet: ${sheetName} (${questionIds.length} questions)`
          );
        } else {
          // Update existing sheet
          const existingSheetDoc = existingSheetSnapshot.docs[0];
          await updateDoc(existingSheetDoc.ref, {
            questionIds,
            totalQuestions: questionIds.length,
            updatedAt: Timestamp.now(),
          });
          console.log(
            `   ✅ Updated sheet: ${sheetName} (${questionIds.length} questions)`
          );
        }
      } catch (error) {
        console.error(`   ❌ Failed to sync sheet ${sheetName}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    process.exit(1);
  }
}

// Run the script
seedQuestions().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

export { seedQuestions };
