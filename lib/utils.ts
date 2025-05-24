import { mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Local fallback for interview covers to prevent import issues
const INTERVIEW_COVERS = [
  "/covers/adobe.png",
  "/covers/amazon.png",
  "/covers/facebook.png",
  "/covers/hostinger.png",
  "/covers/pinterest.png",
  "/covers/quora.png",
  "/covers/reddit.png",
  "/covers/skype.png",
  "/covers/spotify.png",
  "/covers/telegram.png",
  "/covers/tiktok.png",
  "/covers/yahoo.png",
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings?.[key as keyof typeof mappings] || key;
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = (seed?: string) => {
  // Use a seed to make cover selection deterministic for hydration consistency
  let index = 0;
  if (seed) {
    // Simple hash function to convert string to number
    for (let i = 0; i < seed.length; i++) {
      index = (index + seed.charCodeAt(i)) % INTERVIEW_COVERS.length;
    }
  } else {
    // Fallback to first cover for hydration safety
    index = 0;
  }
  return INTERVIEW_COVERS[index];
};
