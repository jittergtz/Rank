  
// Streak history entry
export interface StreakHistoryEntry {
    date: string
    value: number
    action: "check-in" | "reset" | "recovery"
  }
  
  // Rank change history entry
  export interface RankChangeEntry {
    date: string
    from: string
    to: string
  }
  
  // Task interface with added statistics fields
  export interface Task {
    id: string
    name: string
    description: string
    count: number
    lastCheckIn: string | null
    rank: string
    recoveryTokens: number
    previousStreak: number
    lastReset: string | null
    createdAt: string
    active: boolean // New field to track if this is the active task
    // Statistics fields
    longestStreak: number
    totalCheckIns: number
    recoveryTokensUsed: number
    streakHistory: StreakHistoryEntry[]
    rankHistory: RankChangeEntry[]
    checkInDates: string[] // Array of ISO date strings
  }
  
  export const RANKS = [
    { name: "Beginner", threshold: 0, color: "bg-gradient-to-l from-[#14EFFF] to-[#FFA114]", img: "/images/HelloRank.jpg" },
    { name: "Bronze", threshold: 1, color: "bg-gradient-to-r from-[#14ADFF] to-[#3446D1]", img: "/images/BronzeRank.jpg" },
    { name: "Silver", threshold: 10, color: "bg-slate-400", img: "/images/HelloRank.jpg" },
    { name: "Gold", threshold: 20, color: "bg-yellow-500", img: "/images/HelloRank.jpg" },
    { name: "Platinum", threshold: 40, color: "bg-emerald-500", img: "/images/HelloRank.jpg" },
    { name: "Diamond", threshold: 80, color: "bg-blue-500", img: "/images/HelloRank.jpg" },
  ]
  
  // Milestones at which users earn recovery tokens
  export const RECOVERY_MILESTONES = [10, 20, 30, 50, 75, 100, 150, 200, 300, 365]
  
  // How long recovery is available after missing a day (in hours)
  export const RECOVERY_WINDOW_HOURS = 24
  
  // Default task
  export const DEFAULT_TASK: Task = {
    id: "default-task",
    name: "Daily Check-in",
    description: "Track your daily streak",
    count: 0,
    lastCheckIn: null,
    rank: "Beginner",
    recoveryTokens: 0,
    previousStreak: 0,
    lastReset: null,
    createdAt: new Date().toISOString(),
    active: true, // Default task is active
    // Default statistics values
    longestStreak: 0,
    totalCheckIns: 0,
    recoveryTokensUsed: 0,
    streakHistory: [],
    rankHistory: [],
    checkInDates: [],
  }
  
  export const getRankImage = (rankName: string) => {
    const rankLower = rankName.toLowerCase()
    return `/ranks/${rankLower}.svg`
  }
  
  export const getRankFromCount = (count: number) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (count >= RANKS[i].threshold) {
        return RANKS[i].name
      }
    }
    return "Beginner"
  }
  
  export const getRankColor = (rankName: string) => {
    const rank = RANKS.find((r) => r.name === rankName)
    return rank?.color || "bg-zinc-500"
  }
  