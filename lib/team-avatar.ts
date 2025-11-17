// Helper function to get anime avatar for teams
// Uses DiceBear API with adventurer style for cute anime avatars

export function getTeamAvatarUrl(teamName: string): string {
  // Generate consistent hash from team name
  let hash = 0
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Use DiceBear API with adventurer style (cute anime avatars)
  // The seed ensures consistent avatar for the same team name
  const seed = Math.abs(hash).toString()
  
  // Using adventurer style which has cute anime-like characters
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

// Alternative: Using a collection of cute anime animal images
// You can also use this approach with a predefined list of URLs
const ANIME_ANIMAL_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=cat&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=dog&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=bear&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=rabbit&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=panda&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=fox&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=lion&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=tiger&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=penguin&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=owl&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=deer&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=wolf&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=koala&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=hamster&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=squirrel&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=hedgehog&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=seal&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=otter&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=sloth&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=raccoon&backgroundColor=ffdfbf",
]

export function getTeamAvatarFromList(teamName: string): string {
  let hash = 0
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ANIME_ANIMAL_AVATARS[Math.abs(hash) % ANIME_ANIMAL_AVATARS.length]
}

// Main function - uses the seed-based approach for more variety
export function getTeamAvatar(teamName: string): string {
  return getTeamAvatarUrl(teamName)
}

