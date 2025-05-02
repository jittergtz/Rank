"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Trophy, AlertCircle, Undo2, Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

interface StreakData {
  count: number
  lastCheckIn: string | null
  rank: string
  recoveryTokens: number
  previousStreak: number
  lastReset: string | null
}

const RANKS = [
  { name: "Beginner", threshold: 0, color: "bg-gradient-to-tl from-[#2D21D3] to-[#9E61CC]" },
  { name: "Bronze", threshold: 5, color: "bg-amber-400" },
  { name: "Silver", threshold: 10, color: "bg-slate-400" },
  { name: "Gold", threshold: 20, color: "bg-yellow-500" },
  { name: "Platinum", threshold: 40, color: "bg-emerald-500" },
  { name: "Diamond", threshold: 80, color: "bg-blue-500" },
]

// Milestones at which users earn recovery tokens
const RECOVERY_MILESTONES = [10, 20, 30, 50, 75, 100, 150, 200, 300, 365]

// How long recovery is available after missing a day (in hours)
const RECOVERY_WINDOW_HOURS = 24

export default function StreakTracker() {
  const [streakData, setStreakData] = useState<StreakData>({
    count: 0,
    lastCheckIn: null,
    rank: "Beginner",
    recoveryTokens: 0,
    previousStreak: 0,
    lastReset: null,
  })
  const [loading, setLoading] = useState(true)
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [nextRank, setNextRank] = useState(RANKS[1])
  const [progress, setProgress] = useState(0)
  const [recoveryAvailable, setRecoveryAvailable] = useState(false)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load streak data from localStorage
    const loadStreakData = () => {
      const savedData = localStorage.getItem("streakData")
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData) as Partial<StreakData>

          // Handle migration from old data structure
          const migratedData: StreakData = {
            count: parsedData.count || 0,
            lastCheckIn: parsedData.lastCheckIn || null,
            rank: parsedData.rank || "Beginner",
            recoveryTokens: parsedData.recoveryTokens || 0,
            previousStreak: parsedData.previousStreak || 0,
            lastReset: parsedData.lastReset || null,
          }

          setStreakData(migratedData)

          // Check if a day was missed
          if (migratedData.lastCheckIn) {
            const lastCheckIn = new Date(migratedData.lastCheckIn)
            const today = new Date()
            const yesterday = new Date(today)
            yesterday.setDate(yesterday.getDate() - 1)

            // Reset streak if more than one day has passed
            if (lastCheckIn < new Date(yesterday.setHours(0, 0, 0, 0))) {
              resetStreak("You missed a day! Your streak has been reset.", migratedData.count)
            }

            // Determine if user can check in today
            const lastCheckInDay = lastCheckIn.setHours(0, 0, 0, 0)
            const todayDay = today.setHours(0, 0, 0, 0)
            setCanCheckIn(lastCheckInDay < todayDay)
          } else {
            setCanCheckIn(true)
          }

          // Check if recovery is available
          checkRecoveryAvailability(migratedData)
        } catch (error) {
          console.error("Error parsing streak data:", error)
          setStreakData({
            count: 0,
            lastCheckIn: null,
            rank: "Beginner",
            recoveryTokens: 0,
            previousStreak: 0,
            lastReset: null,
          })
          setCanCheckIn(true)
        }
      }
      setLoading(false)
    }

    loadStreakData()
  }, [])

  useEffect(() => {
    // Update rank based on streak count
    const currentRankIndex = RANKS.findIndex(
      (rank, index) =>
        streakData.count >= rank.threshold &&
        (index === RANKS.length - 1 || streakData.count < RANKS[index + 1].threshold),
    )

    const currentRank = RANKS[currentRankIndex]
    const nextRankIndex = Math.min(currentRankIndex + 1, RANKS.length - 1)
    const nextRank = RANKS[nextRankIndex]

    if (streakData.rank !== currentRank.name) {
      setStreakData((prev) => ({
        ...prev,
        rank: currentRank.name,
      }))
    }

    setNextRank(nextRank)

    // Calculate progress to next rank
    if (currentRank.name !== nextRank.name) {
      const progressValue =
        ((streakData.count - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100
      setProgress(progressValue)
    } else {
      setProgress(100)
    }

    // Check if recovery is available
    checkRecoveryAvailability(streakData)
  }, [streakData.count, streakData.rank, streakData.lastReset])

  // Separate useEffect for localStorage updates
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("streakData", JSON.stringify(streakData))
    }
  }, [streakData, loading])

  const checkRecoveryAvailability = (data: StreakData) => {
    if (data.lastReset && data.recoveryTokens > 0 && data.previousStreak > 0) {
      const resetTime = new Date(data.lastReset).getTime()
      const currentTime = new Date().getTime()
      const hoursSinceReset = (currentTime - resetTime) / (1000 * 60 * 60)

      setRecoveryAvailable(hoursSinceReset <= RECOVERY_WINDOW_HOURS)
    } else {
      setRecoveryAvailable(false)
    }
  }

  const handleCheckIn = () => {
    if (!canCheckIn) {
      toast({
        title: "Already checked in",
        description: "You've already checked in today. Come back tomorrow!",
        variant: "default",
      })
      return
    }

    const newCount = streakData.count + 1
    const today = new Date().toISOString()

    // Check if user reached a milestone that awards a recovery token
    let newRecoveryTokens = streakData.recoveryTokens
    if (RECOVERY_MILESTONES.includes(newCount)) {
      newRecoveryTokens += 1
      toast({
        title: "Recovery Token Earned!",
        description: "You've earned a recovery token for reaching a streak milestone!",
        variant: "default",
      })
    }

    setStreakData((prev) => ({
      ...prev,
      count: newCount,
      lastCheckIn: today,
      recoveryTokens: newRecoveryTokens,
    }))

    setCanCheckIn(false)

    // Check if rank changed
    const prevRank = getRankFromCount(streakData.count)
    const newRank = getRankFromCount(newCount)

    if (prevRank !== newRank) {
      toast({
        title: "New Rank Achieved!",
        description: `Congratulations! You've reached ${newRank} rank!`,
        variant: "default",
      })
    } else {
      toast({
        title: "Streak Updated!",
        description: `Your streak is now ${newCount} days!`,
        variant: "default",
      })
    }
  }

  const resetStreak = (message?: string, previousStreakCount?: number) => {
    const now = new Date().toISOString()

    setStreakData((prev) => ({
      ...prev,
      count: 0,
      lastCheckIn: null,
      rank: "Beginner",
      previousStreak: previousStreakCount || prev.previousStreak,
      lastReset: now,
    }))

    setCanCheckIn(true)

    if (message) {
      toast({
        title: "Streak Reset",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleRecoveryAttempt = () => {
    setShowRecoveryDialog(true)
  }

  const confirmRecovery = () => {
    if (streakData.recoveryTokens > 0 && streakData.previousStreak > 0) {
      setStreakData((prev) => ({
        ...prev,
        count: prev.previousStreak,
        recoveryTokens: prev.recoveryTokens - 1,
        previousStreak: 0,
        lastReset: null,
      }))

      toast({
        title: "Streak Recovered!",
        description: `Your ${streakData.previousStreak}-day streak has been restored. You have ${streakData.recoveryTokens - 1} recovery tokens left.`,
        variant: "default",
      })

      setRecoveryAvailable(false)
    }

    setShowRecoveryDialog(false)
  }

  const getRankFromCount = (count: number) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (count >= RANKS[i].threshold) {
        return RANKS[i].name
      }
    }
    return "Beginner"
  }

  const getRankColor = (rankName: string) => {
    const rank = RANKS.find((r) => r.name === rankName)
    return rank?.color || "bg-zinc-500"
  }

  const getRecoveryTimeLeft = () => {
    if (!streakData.lastReset) return null

    const resetTime = new Date(streakData.lastReset).getTime()
    const currentTime = new Date().getTime()
    const hoursSinceReset = (currentTime - resetTime) / (1000 * 60 * 60)
    const hoursLeft = Math.max(0, Math.floor(RECOVERY_WINDOW_HOURS - hoursSinceReset))

    return hoursLeft
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Card className="w-full border-none shadow-none">
        <CardHeader className="text-center">
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="shadow-xl shadow-[#221f32] rounded-3xl  overflow-hiden flex">
            <Image
            src={"/images/DarkRank.jpg"}
            alt="Dark Rank"
            className="h-40 w-40 object-cover overflow-hidden rounded-3xl pointer-evenets-none"
            width={1120}
            height={1120}/>
            </div>

            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative">
              <div
                className={`  flex items-center mt-5 justify-center text-5xl font-bold  text-white`}
              >
                {streakData.count}
              </div>
            
            </motion.div>
            <div className="text-lg font-semibold">Day{streakData.count !== 1 ? "s" : ""}</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Badge className={`${getRankColor(streakData.rank)} hover:${getRankColor(streakData.rank)}`}>
                {streakData.rank}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {streakData.rank !== nextRank.name
                  ? `${nextRank.threshold - streakData.count} days to ${nextRank.name}`
                  : "Max rank achieved!"}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {streakData.lastCheckIn && (
            <div className="text-sm text-center text-muted-foreground">
              Last check-in: {new Date(streakData.lastCheckIn).toLocaleDateString()}
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              size="lg"
              className={`w-full rounded-full p-7 ${canCheckIn ? `bg-neutral-200 text-black ${getRankColor(streakData.rank)}` : "bg-neutral-500 text-white"}`}
            >
              {canCheckIn ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" /> Check In Today
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" /> Already Checked In
                </>
              )}
            </Button>
          </div>

          {/* Recovery tokens display */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-amber-500" />
            <span>Recovery Tokens: {streakData.recoveryTokens}</span>
          </div>

          {/* Recovery option */}
          {recoveryAvailable && (
            <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded-md p-3">
              <div className="flex flex-col gap-2">
                <p className="text-sm">
                  You can recover your previous {streakData.previousStreak}-day streak!
                  <span className="font-medium"> ({getRecoveryTimeLeft()} hours left)</span>
                </p>
                <Button
                  onClick={handleRecoveryAttempt}
                  variant="outline"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
                >
                  <Undo2 className="mr-2 h-4 w-4" /> Use Recovery Token
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={() => resetStreak("Streak manually reset")}>
            <AlertCircle className="mr-2 h-4 w-4" /> Reset Streak
          </Button>
          {streakData.count > 0 && (
            <div className="text-sm text-muted-foreground">Don't miss a day to keep your streak!</div>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recover Your Streak?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to use 1 recovery token to restore your previous {streakData.previousStreak}-day streak. You
              have {streakData.recoveryTokens} recovery token{streakData.recoveryTokens !== 1 ? "s" : ""} remaining.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRecovery}>Recover Streak</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
