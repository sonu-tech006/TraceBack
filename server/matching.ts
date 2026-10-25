import { Item, MatchCandidate } from './db.js';

// Calculate similarity between two items
export function calculateMatchScore(lost: Item, found: Item): {
  score: number;
  breakdown: {
    categoryScore: number;
    brandScore: number;
    colorScore: number;
    locationScore: number;
    dateScore: number;
    textScore: number;
  };
  matchingAttributes: string[];
  conflictingAttributes: string[];
  whySuggested: string;
} {
  const matchingAttributes: string[] = [];
  const conflictingAttributes: string[] = [];

  // 1. Category and Subcategory matching (max 25)
  let categoryScore = 0;
  if (lost.category.toLowerCase() === found.category.toLowerCase()) {
    categoryScore += 15;
    matchingAttributes.push(`Same category: ${lost.category}`);
    if (lost.subcategory.toLowerCase() === found.subcategory.toLowerCase()) {
      categoryScore += 10;
      matchingAttributes.push(`Matching subcategory: ${lost.subcategory}`);
    }
  } else {
    conflictingAttributes.push(`Different categories (${lost.category} vs ${found.category})`);
  }

  // 2. Brand matching (max 20)
  let brandScore = 0;
  const lostBrand = lost.brand?.trim().toLowerCase() || '';
  const foundBrand = found.brand?.trim().toLowerCase() || '';
  if (lostBrand && foundBrand) {
    if (lostBrand === foundBrand || lostBrand.includes(foundBrand) || foundBrand.includes(lostBrand)) {
      brandScore = 20;
      matchingAttributes.push(`Matching manufacturer/brand: ${lost.brand}`);
    } else if (lostBrand !== 'unmarked' && foundBrand !== 'unmarked') {
      conflictingAttributes.push(`Brand difference (${lost.brand} vs ${found.brand})`);
    }
  }

  // 3. Color matching (max 15)
  let colorScore = 0;
  const lostColor = lost.color?.trim().toLowerCase() || '';
  const foundColor = found.color?.trim().toLowerCase() || '';
  if (lostColor && foundColor) {
    const lostWords = lostColor.split(/[\s,/]+/);
    const foundWords = foundColor.split(/[\s,/]+/);
    const colorOverlap = lostWords.some((w) => w.length > 2 && foundWords.some((fw) => fw.includes(w) || w.includes(fw)));

    if (lostColor === foundColor || colorOverlap) {
      colorScore = 15;
      matchingAttributes.push(`Color correspondence: ${lost.color}`);
    } else {
      conflictingAttributes.push(`Color distinction (${lost.color} vs ${found.color})`);
    }
  }

  // 4. Location & City matching (max 20)
  let locationScore = 0;
  const lostCity = lost.city?.trim().toLowerCase() || '';
  const foundCity = found.city?.trim().toLowerCase() || '';
  const lostLoc = lost.location?.trim().toLowerCase() || '';
  const foundLoc = found.location?.trim().toLowerCase() || '';

  if (lostCity && foundCity && lostCity === foundCity) {
    locationScore += 8;
    matchingAttributes.push(`Same city: ${lost.city}`);
  }

  if (lostLoc && foundLoc) {
    if (lostLoc === foundLoc || lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc)) {
      locationScore += 12;
      matchingAttributes.push(`Same venue/location: ${lost.location}`);
    } else {
      // Check keyword overlap (e.g., "Library", "Gym", "Dining", "Atrium")
      const venueKeywords = ['library', 'union', 'gym', 'atrium', 'cafe', 'station', 'transit', 'hall', 'dorm'];
      const shared = venueKeywords.find((k) => lostLoc.includes(k) && foundLoc.includes(k));
      if (shared) {
        locationScore += 7;
        matchingAttributes.push(`Shared facility zone (${shared})`);
      }
    }
  }

  // 5. Date compatibility (max 10)
  // Found date should typically be on or after lost date (or within 1 day if estimated)
  let dateScore = 0;
  const lostDate = new Date(lost.date).getTime();
  const foundDate = new Date(found.date).getTime();
  const dayDelta = Math.round((foundDate - lostDate) / (1000 * 60 * 60 * 24));

  if (dayDelta >= 0 && dayDelta <= 3) {
    dateScore = 10;
    matchingAttributes.push(`Found within ${dayDelta === 0 ? 'same day' : `${dayDelta} days`} of reported loss`);
  } else if (dayDelta > 3 && dayDelta <= 14) {
    dateScore = 7;
    matchingAttributes.push(`Found within 2 weeks of reported loss (${dayDelta} days)`);
  } else if (dayDelta === -1) {
    // Possible timezone or approximate date reporting
    dateScore = 4;
  } else if (dayDelta < -1) {
    conflictingAttributes.push(`Item reported found before lost date (${Math.abs(dayDelta)} days prior)`);
  }

  // 6. Title and Description text similarity (max 10)
  let textScore = 0;
  const lostText = `${lost.title} ${lost.description}`.toLowerCase();
  const foundText = `${found.title} ${found.description}`.toLowerCase();
  
  const tokens = Array.from(new Set(lostText.split(/[^a-z0-9]+/))).filter((t) => t.length > 3 && !['with', 'from', 'near', 'this', 'that', 'have', 'were', 'left', 'found'].includes(t));
  let tokenMatches = 0;
  for (const token of tokens) {
    if (foundText.includes(token)) {
      tokenMatches++;
    }
  }

  if (tokens.length > 0) {
    const ratio = tokenMatches / Math.min(tokens.length, 10);
    textScore = Math.min(10, Math.round(ratio * 10));
    if (tokenMatches >= 2) {
      matchingAttributes.push(`${tokenMatches} descriptive keywords matched`);
    }
  }

  const totalScore = Math.min(100, categoryScore + brandScore + colorScore + locationScore + dateScore + textScore);

  let whySuggested = '';
  if (totalScore >= 80) {
    whySuggested = `High compatibility on category, brand (${lost.brand}), color tone (${lost.color}), and geographic venue (${lost.location}).`;
  } else if (totalScore >= 60) {
    whySuggested = `Moderate match based on matching ${lost.category} profile and compatible recovery timeline in ${lost.city}.`;
  } else {
    whySuggested = `Potential candidate sharing partial attributes in ${lost.category}. Detailed physical verification required.`;
  }

  return {
    score: totalScore,
    breakdown: {
      categoryScore,
      brandScore,
      colorScore,
      locationScore,
      dateScore,
      textScore,
    },
    matchingAttributes,
    conflictingAttributes,
    whySuggested,
  };
}

// Generate candidate matches between all open/matched items
export function computeMatches(lostItems: Item[], foundItems: Item[]): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];

  for (const lost of lostItems) {
    for (const found of foundItems) {
      // Must be same general category or strong keyword overlap
      if (lost.category !== found.category) continue;

      const res = calculateMatchScore(lost, found);
      if (res.score >= 50) {
        candidates.push({
          id: `match-${lost.id}-${found.id}`,
          lostItemId: lost.id,
          foundItemId: found.id,
          lostItemTitle: lost.title,
          foundItemTitle: found.title,
          score: res.score,
          breakdown: res.breakdown,
          matchingAttributes: res.matchingAttributes,
          conflictingAttributes: res.conflictingAttributes,
          whySuggested: res.whySuggested,
          status: 'potential',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}
