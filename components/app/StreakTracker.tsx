"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Trophy, AlertCircle, Undo2, Gift, PartyPopper } from "lucide-react" // Added PartyPopper
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { TaskSelector } from "./TaskSelector"
import { TaskStatistics } from "./TaskStatistics"
import { TaskCreator } from "./TaskCreator"


// --- Component Imports (Assuming these exist based on File 1) ---
// If these are not separate components, their JSX/logic needs to be integrated directly

// --- End Component Imports ---

// --- Type Definitions (from File 1, potentially simplified/adapted) ---
export interface StreakHistoryEntry {
  date: string
  value: number
  action: "check-in" | "reset" | "recovery"
}

export interface RankChangeEntry {
  date: string
  from: string
  to: string
}

export type RankName = "Beginner" | "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" // Updated ranks

export interface Task {
  id: string
  name: string
  description: string
  count: number
  lastCheckIn: string | null
  rank: RankName
  recoveryTokens: number
  previousStreak: number
  lastReset: string | null
  createdAt: string
  active: boolean // Crucial for check-in logic
  // Statistics fields
  longestStreak: number
  totalCheckIns: number
  recoveryTokensUsed: number
  streakHistory: StreakHistoryEntry[]
  rankHistory: RankChangeEntry[]
  checkInDates: string[]
}
// --- End Type Definitions ---

// --- Constants (Using File 2's RANKS as requested) ---
const RANKS = [
  { name: "Beginner", threshold: 0, color: "bg-gradient-to-l from-[#690B0B] to-[#FF1174]", img: "/images/SevenRank.jpg" },
  { name: "Bronze", threshold: 1, color: "bg-gradient-to-r from-[#14ADFF] to-[#3446D1]", img: "/images/BronzeRank.jpg" },
  { name: "Silver", threshold: 10, color: "bg-slate-400", img: "/images/HelloRank.jpg" },
  { name: "Gold", threshold: 20, color: "bg-yellow-500", img: "/images/SevenRank.jpg" },
  { name: "Platinum", threshold: 40, color: "bg-emerald-500", img: "/images/HelloRank.jpg" },
  { name: "Diamond", threshold: 80, color: "bg-blue-500", img: "/images/HelloRank.jpg" },
] as const // Use 'as const' for stricter typing on names

const RECOVERY_MILESTONES = [10, 20, 30, 50, 75, 100, 150, 200, 300, 365]
const RECOVERY_WINDOW_HOURS = 24

// Default task structure from File 1
const DEFAULT_TASK: Task = {
  id: `default-${Date.now()}`,
  name: "Default Task",
  description: "My first streak goal",
  count: 0,
  lastCheckIn: null,
  rank: "Beginner",
  recoveryTokens: 0,
  previousStreak: 0,
  lastReset: null,
  createdAt: new Date().toISOString(),
  active: true, // Default task is active
  longestStreak: 0,
  totalCheckIns: 0,
  recoveryTokensUsed: 0,
  streakHistory: [],
  rankHistory: [],
  checkInDates: [],
}
// --- End Constants ---

export default function StreakTracker() {
  const [tasks, setTasks] = useState<Task[]>([DEFAULT_TASK])
  const [selectedTaskId, setSelectedTaskId] = useState<string>(DEFAULT_TASK.id)
  const [loading, setLoading] = useState(true)
  const [canCheckIn, setCanCheckIn] = useState(false)
  const [nextRankInfo, setNextRankInfo] = useState<(typeof RANKS)[number]>(RANKS[1]) // Accept any rank object from RANKS
  const [progress, setProgress] = useState(0)
  const [recoveryAvailable, setRecoveryAvailable] = useState(false)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false)
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false) // From File 1
  const [editingTask, setEditingTask] = useState<Task | null>(null) // From File 1
  const [activeTab, setActiveTab] = useState<string>("tracker") // From File 1
  const [statsPeriod, setStatsPeriod] = useState<"week" | "month" | "all">("month") // From File 1
  const [showCongratulations, setShowCongratulations] = useState(false) // From File 2
  const [newRankAchieved, setNewRankAchieved] = useState<RankName>("Beginner") // From File 2, typed
  const { toast } = useToast()
  // --- End State Hooks ---

  // --- Derived State ---
  // Get the currently selected task based on selectedTaskId
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0] || DEFAULT_TASK // Ensure fallback

  // --- Helper Functions (Using File 2's Rank Helpers) ---
  const getRankFromCount = (count: number): RankName => {
    // Iterate backwards to find the highest matching rank
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (count >= RANKS[i].threshold) {
        // Ensure the found rank name is one of the defined RankName types
        const rankName = RANKS[i].name as RankName
        return rankName
      }
    }
    return "Beginner" // Default fallback
  }

  const getRankColor = (rankName: RankName): string => {
    const rank = RANKS.find((r) => r.name === rankName)
    return rank?.color || "bg-zinc-500" // Fallback color
  }

  const getRankImage = (rankName: RankName): string => {
    const rank = RANKS.find((r) => r.name === rankName)
    return rank?.img || "/images/HelloRank.jpg" // Fallback image
  }

  const getRecoveryTimeLeft = (task: Task): number | null => {
    if (!task.lastReset) return null
    const resetTime = new Date(task.lastReset).getTime()
    const currentTime = new Date().getTime()
    const hoursSinceReset = (currentTime - resetTime) / (1000 * 60 * 60)
    const hoursLeft = Math.max(0, Math.floor(RECOVERY_WINDOW_HOURS - hoursSinceReset))
    return hoursLeft
  }

  // Helper to update a task immutably (from File 1)
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)))
  }
  // --- End Helper Functions ---

  // --- useEffect for Loading Data (Adapted from File 1) ---
  useEffect(() => {
    const loadTasksData = () => {
      const savedData = localStorage.getItem("streakTasks")
      let loadedTasks: Task[] = []

      if (savedData) {
        try {
          const parsedTasks = JSON.parse(savedData) as Partial<Task>[]
          const migratedTasks = parsedTasks.map((task) => {
            // Ensure all fields exist, migrate old data if necessary
            const completeTask: Task = {
              id: task.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: task.name || "Unnamed Task",
              description: task.description || "",
              count: task.count || 0,
              lastCheckIn: task.lastCheckIn || null,
              rank: (task.rank as RankName) || "Beginner", // Ensure rank type
              recoveryTokens: task.recoveryTokens || 0,
              previousStreak: task.previousStreak || 0,
              lastReset: task.lastReset || null,
              createdAt: task.createdAt || new Date().toISOString(),
              active: task.active !== undefined ? task.active : false, // Default to false unless specified
              // Statistics fields with migration
              longestStreak: task.longestStreak || task.count || 0,
              totalCheckIns: task.totalCheckIns || task.count || 0,
              recoveryTokensUsed: task.recoveryTokensUsed || 0,
              streakHistory: task.streakHistory || [],
              rankHistory: task.rankHistory || [],
              checkInDates: task.checkInDates || (task.lastCheckIn ? [task.lastCheckIn] : []),
            }
            // Recalculate rank based on count just in case it's inconsistent
            completeTask.rank = getRankFromCount(completeTask.count)
            return completeTask
          })

          loadedTasks = migratedTasks

          // Ensure we have at least one task
          if (loadedTasks.length === 0) {
            loadedTasks.push(DEFAULT_TASK)
          }

          // Ensure exactly one task is active
          const activeTaskCount = loadedTasks.filter((task) => task.active).length
          if (activeTaskCount === 0) {
            loadedTasks[0].active = true // Make the first task active if none are
          } else if (activeTaskCount > 1) {
            // If multiple active, keep only the first one found
            let foundActive = false
            loadedTasks = loadedTasks.map((task) => {
              if (task.active) {
                if (foundActive) {
                  return { ...task, active: false }
                } else {
                  foundActive = true
                }
              }
              return task
            })
          }
        } catch (error) {
          console.error("Error parsing tasks data:", error)
          loadedTasks = [DEFAULT_TASK] // Fallback to default task on error
        }
      } else {
         loadedTasks = [DEFAULT_TASK] // Use default if no saved data
      }


      // Check ALL tasks for missed days after loading
      let streakResetsOccurred = false
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).getTime()

      const checkedTasks = loadedTasks.map((task) => {
        if (task.lastCheckIn) {
          const lastCheckInTime = new Date(task.lastCheckIn).getTime()

          // Reset streak if last check-in was before yesterday
          if (lastCheckInTime < yesterdayStart) {
             streakResetsOccurred = true
             const resetDate = new Date().toISOString()
             const historyEntry: StreakHistoryEntry = { date: resetDate, value: 0, action: "reset" }
             return {
                ...task,
                count: 0,
                lastCheckIn: null, // Clear last check-in after reset
                rank: "Beginner" as RankName, // Reset rank with explicit type
                previousStreak: task.count, // Store the lost streak count
                lastReset: resetDate,
                streakHistory: [...task.streakHistory, historyEntry],
             }
          }
        }
        return task
      })

      setTasks(checkedTasks)

      if (streakResetsOccurred) {
        toast({
          title: "Streaks Reset",
          description: "Some streaks were reset because a day was missed.",
          variant: "destructive",
        })
      }


      // Set selected task ID
      const lastSelectedId = localStorage.getItem("selectedTaskId")
      const activeTask = checkedTasks.find(task => task.active)
      if (lastSelectedId && checkedTasks.some((task) => task.id === lastSelectedId)) {
        setSelectedTaskId(lastSelectedId)
      } else if (activeTask) {
         setSelectedTaskId(activeTask.id) // Default to active task
      } else {
        setSelectedTaskId(checkedTasks[0].id) // Default to first task
      }

      setLoading(false)
    }

    loadTasksData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only on mount


  // --- useEffect for Calculating Derived State (Check-in, Rank, Recovery) ---
  useEffect(() => {
    if (!selectedTask || loading) return // Don't run if loading or no task selected

    // 1. Check if user can check in for the selected task today
    let canCheckInToday = true
    if (selectedTask.lastCheckIn) {
      const lastCheckInDay = new Date(selectedTask.lastCheckIn).setHours(0, 0, 0, 0)
      const todayDay = new Date().setHours(0, 0, 0, 0)
      canCheckInToday = lastCheckInDay < todayDay
    }
    setCanCheckIn(canCheckInToday)

    // 2. Check if recovery is available for the selected task
    let isRecoveryAvailable = false
    if (selectedTask.lastReset && selectedTask.recoveryTokens > 0 && selectedTask.previousStreak > 0) {
      const resetTime = new Date(selectedTask.lastReset).getTime()
      const currentTime = new Date().getTime()
      const hoursSinceReset = (currentTime - resetTime) / (1000 * 60 * 60)
      isRecoveryAvailable = hoursSinceReset <= RECOVERY_WINDOW_HOURS
    }
    setRecoveryAvailable(isRecoveryAvailable)

    // 3. Update rank information for the selected task
    const currentRank = getRankFromCount(selectedTask.count) // Use helper
    const currentRankIndex = RANKS.findIndex((r) => r.name === currentRank)
    const nextRank = RANKS[Math.min(currentRankIndex + 1, RANKS.length - 1)]
    setNextRankInfo(nextRank)

    // Calculate progress
    if (currentRank !== nextRank.name) {
      const currentRankThreshold = RANKS[currentRankIndex].threshold
      const nextRankThreshold = nextRank.threshold
      const progressValue =
        nextRankThreshold > currentRankThreshold
          ? ((selectedTask.count - currentRankThreshold) / (nextRankThreshold - currentRankThreshold)) * 100
          : 100 // Avoid division by zero if thresholds are same (max rank)
      setProgress(progressValue)
    } else {
      setProgress(100) // Max rank
    }

     // Update task rank in state if it differs (this will trigger save)
     // No need for rankHistory update here as it's handled in check-in/recovery
     if (selectedTask.rank !== currentRank) {
        // No need to explicitly call updateTask here, rank is derived.
        // Rank history added on actual event (check-in, recovery).
     }

  }, [selectedTask, selectedTaskId, loading, tasks]) // Rerun when selected task or tasks array changes


  // --- useEffect for Saving Data (Adapted from File 1) ---
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("streakTasks", JSON.stringify(tasks))
      localStorage.setItem("selectedTaskId", selectedTaskId)
    }
  }, [tasks, selectedTaskId, loading])
  // --- End useEffect Hooks ---


  // --- Event Handlers (Merged & Adapted) ---

  const handleCheckIn = () => {
    if (!selectedTask) return

    // Check if the *selected* task is the *active* task (from File 1 logic)
    if (!selectedTask.active) {
      toast({
        title: "Not Active Task",
        description: `"${selectedTask.name}" is not your active task. Check-ins only count for the active task.`,
        variant: "default",
      })
      return
    }

    if (!canCheckIn) {
      toast({
        title: "Already checked in",
        description: "You've already checked in today for this task. Come back tomorrow!",
        variant: "default",
      })
      return
    }

    const newCount = selectedTask.count + 1
    const today = new Date().toISOString()
    const prevRank = selectedTask.rank // Rank before check-in
    const newRank = getRankFromCount(newCount) // Rank after check-in

    // Check for recovery token milestone
    let newRecoveryTokens = selectedTask.recoveryTokens
    if (RECOVERY_MILESTONES.includes(newCount)) {
      newRecoveryTokens += 1
      toast({
        title: "Recovery Token Earned!",
        description: `Milestone! You earned a recovery token for reaching ${newCount} days on "${selectedTask.name}"!`,
        variant: "default",
      })
    }

    // Prepare updates
    const updates: Partial<Task> = {
      count: newCount,
      lastCheckIn: today,
      rank: newRank, // Update rank based on new count
      recoveryTokens: newRecoveryTokens,
      longestStreak: Math.max(selectedTask.longestStreak, newCount),
      totalCheckIns: selectedTask.totalCheckIns + 1,
      checkInDates: [...selectedTask.checkInDates, today],
      streakHistory: [...selectedTask.streakHistory, { date: today, value: newCount, action: "check-in" }],
      // Add rank history only if the rank actually changed
      rankHistory: prevRank !== newRank
        ? [...selectedTask.rankHistory, { date: today, from: prevRank, to: newRank }]
        : selectedTask.rankHistory,
    }

    // Update the task in the state
    updateTask(selectedTaskId, updates)
    setCanCheckIn(false) // Prevent immediate re-check-in

    // Handle Rank Up - Use File 2's Modal
    if (prevRank !== newRank) {
      setNewRankAchieved(newRank)
      setShowCongratulations(true)
    } else {
      toast({
        title: "Streak Updated!",
        description: `Your streak for "${selectedTask.name}" is now ${newCount} days! Keep it up!`,
        variant: "default",
      })
    }
  }

  const resetStreak = (taskId: string, message?: string) => {
     const taskToReset = tasks.find(t => t.id === taskId)
     if (!taskToReset) return

     const now = new Date().toISOString()
     const historyEntry: StreakHistoryEntry = { date: now, value: 0, action: "reset" }

     updateTask(taskId, {
        count: 0,
        // Keep lastCheckIn as null until next check-in
        rank: "Beginner",
        previousStreak: taskToReset.count, // Store the lost streak
        lastReset: now,
        streakHistory: [...taskToReset.streakHistory, historyEntry],
        // Optionally reset rank history or keep it
     })

     // If resetting the currently selected task, allow check-in again
     if (taskId === selectedTaskId) {
       setCanCheckIn(true)
     }

     if (message) {
       toast({
         title: "Streak Reset",
         description: `${message} for "${taskToReset.name}".`,
         variant: "destructive",
       })
     }
   }

  const handleRecoveryAttempt = () => {
    if (!selectedTask) return
    // Check if recovery is possible before showing dialog (belt and suspenders)
    if (selectedTask.recoveryTokens > 0 && selectedTask.previousStreak > 0 && recoveryAvailable) {
       setShowRecoveryDialog(true)
    } else {
        toast({ title: "Recovery Not Available", description: "Cannot recover streak at this time.", variant: "default"})
    }
  }

  const confirmRecovery = () => {
    if (!selectedTask) return

    if (selectedTask.recoveryTokens > 0 && selectedTask.previousStreak > 0 && recoveryAvailable) {
      const restoredCount = selectedTask.previousStreak
      const newRank = getRankFromCount(restoredCount)
      const now = new Date().toISOString()
      const historyEntry: StreakHistoryEntry = { date: now, value: restoredCount, action: "recovery" }
      const rankHistoryEntry: RankChangeEntry = { date: now, from: selectedTask.rank, to: newRank }

      updateTask(selectedTaskId, {
        count: restoredCount,
        rank: newRank,
        recoveryTokens: selectedTask.recoveryTokens - 1,
        previousStreak: 0, // Clear previous streak after recovery
        lastReset: null, // Clear last reset time
        recoveryTokensUsed: selectedTask.recoveryTokensUsed + 1,
        streakHistory: [...selectedTask.streakHistory, historyEntry],
        rankHistory: [...selectedTask.rankHistory, rankHistoryEntry] // Add rank change due to recovery
      })

      toast({
        title: "Streak Recovered!",
        description: `Restored ${restoredCount}-day streak for "${selectedTask.name}". ${selectedTask.recoveryTokens - 1} tokens left.`,
        variant: "default",
      })

      setRecoveryAvailable(false) // Hide recovery button immediately
    } else {
        // This case shouldn't be reachable if button logic is correct, but good to handle
        toast({ title: "Recovery Failed", description: "Could not recover streak.", variant: "destructive"})
    }

    setShowRecoveryDialog(false)
  }

  // --- Task Management Handlers (from File 1) ---
   const createNewTask = (name: string, description: string) => {
    if (!name.trim()) {
       toast({ title: "Task Name Required", variant: "destructive"})
       return
    }
    const newTask: Task = {
       id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
       name: name.trim(),
       description: description.trim(),
       count: 0, lastCheckIn: null, rank: "Beginner", recoveryTokens: 0,
       previousStreak: 0, lastReset: null, createdAt: new Date().toISOString(),
       active: false, // New tasks start inactive
       longestStreak: 0, totalCheckIns: 0, recoveryTokensUsed: 0,
       streakHistory: [], rankHistory: [], checkInDates: []
    }
    const newTasks = [...tasks, newTask]
    // If this is the only task, make it active
    if (newTasks.length === 1) {
      newTask.active = true
    }

    setTasks(newTasks)
    setSelectedTaskId(newTask.id) // Select the new task
    setActiveTab("tracker") // Switch back to tracker view

    toast({ title: "Task Created", description: `"${newTask.name}" added.`})
   }

   const editTask = (taskId: string, name: string, description: string) => {
     if (!name.trim()) {
       toast({ title: "Task Name Required", variant: "destructive"})
       return
     }
     updateTask(taskId, { name: name.trim(), description: description.trim() })
     toast({ title: "Task Updated", description: `"${name.trim()}" saved.`})
   }

   const openDeleteTaskDialog = (task: Task) => {
     setEditingTask(task) // Store task to be deleted for the dialog message
     setShowDeleteTaskDialog(true)
   }

   const deleteTask = (taskId: string) => {
     if (tasks.length <= 1) {
       toast({ title: "Cannot Delete", description: "Must have at least one task.", variant: "destructive"})
       return
     }

     const taskToDelete = tasks.find(t => t.id === taskId)
     if (!taskToDelete) return

     const remainingTasks = tasks.filter(task => task.id !== taskId)

     // If deleting the active task, make the first remaining task active
     if (taskToDelete.active && remainingTasks.length > 0) {
       remainingTasks[0].active = true
     }

     setTasks(remainingTasks)

     // If deleting the selected task, select the new active task or the first remaining one
     if (taskId === selectedTaskId) {
       const newActiveTask = remainingTasks.find(t => t.active)
       setSelectedTaskId(newActiveTask ? newActiveTask.id : remainingTasks[0].id)
     }

     setShowDeleteTaskDialog(false)
     setEditingTask(null)
     toast({ title: "Task Deleted", description: `"${taskToDelete.name}" removed.`})
   }

   const setActiveTask = (taskId: string) => {
     const taskToActivate = tasks.find(t => t.id === taskId)
     if (!taskToActivate || taskToActivate.active) return // No change needed

     const updatedTasks = tasks.map(task => ({
       ...task,
       active: task.id === taskId // Set the target task active, others inactive
     }))

     setTasks(updatedTasks)
     setSelectedTaskId(taskId) // Also select the newly active task

     toast({
       title: "Active Task Changed",
       description: `"${taskToActivate.name}" is now your active focus.`,
     })
   }

  // --- End Event Handlers ---


  // --- Render JSX (Using File 2's Structure + Tabs + Task Components) ---
  return (
    <>
      {/* Use Card styling from File 2, but remove border/shadow as requested */}
      <Card className="w-full max-w-md mx-auto shadow-none border-none bg-transparent">
        {/* Keep Header minimal or remove if not needed */}
        <CardHeader className="text-center pb-2 pt-4">
           {/* Title could show active task name if needed, or kept simple */}
           {/* <CardTitle className="text-2xl">Streak Tracker</CardTitle> */}
           {/* <CardDescription>Track your daily streaks</CardDescription> */}
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="tracker">Tracker</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="tasks">Manage</TabsTrigger>
          </TabsList>

          {/* Tracker Tab Content */}
          <TabsContent value="tracker" className="space-y-4">
             {/* Task Selector (only if more than one task) - From File 1 */}
             {tasks.length > 1 && (
               <div className="px-4">
                 <TaskSelector
                   tasks={tasks}
                   selectedTaskId={selectedTaskId}
                   setSelectedTaskId={setSelectedTaskId}
                   setActiveTask={setActiveTask} // Pass the function to handle activation
                 />
               </div>
             )}

            {/* Main content from File 2, adapted for selectedTask */}
            <CardContent className="space-y-6 pt-2">
              {selectedTask.description && (
                <div className="text-sm text-center text-muted-foreground px-4">{selectedTask.description}</div>
              )}

              <div className="flex flex-col items-center justify-center space-y-2">
                {/* Rank Image using Next Image - From File 2 */}
                <div className="shadow-xl shadow-[#000000] rounded-3xl overflow-hidden flex">
                  <Image
                    src={getRankImage(selectedTask.rank)}
                    alt={`${selectedTask.rank} Rank`}
                    className="h-40 w-40 object-cover overflow-hidden rounded-3xl pointer-events-none"
                    width={160} // Provide explicit width/height
                    height={160}
                    priority // Prioritize loading the main image
                  />
                </div>

                {/* Streak Count - From File 2 */}
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative">
                  <div className={`flex items-center mt-5 justify-center text-5xl font-bold text-neutral-800 dark:text-white`}>
                    {selectedTask.count}
                  </div>
                </motion.div>
                <div className="text-lg font-semibold">Day{selectedTask.count !== 1 ? "s" : ""}</div>
              </div>

              {/* Rank and Progress - From File 2, adapted for selectedTask */}
              <div className="space-y-2 px-4">
                <div className="flex justify-between items-center">
                  <Badge className={`border border-black text-white ${getRankColor(selectedTask.rank)} hover:${getRankColor(selectedTask.rank)}`}>
                    {selectedTask.rank}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedTask.rank !== nextRankInfo.name
                      ? `${nextRankInfo.threshold - selectedTask.count} days to ${nextRankInfo.name}`
                      : "Max rank achieved!"}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Last Check-in - From File 2, adapted */}
              {selectedTask.lastCheckIn && (
                <div className="text-sm text-center text-muted-foreground">
                  Last check-in: {new Date(selectedTask.lastCheckIn).toLocaleDateString()}
                </div>
              )}

              {/* Check-in Button - Styling from File 2, Logic merged from File 1 */}
              <div className="flex justify-center px-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || !selectedTask.active} // Disable if not check-in day OR not active task
                  size="lg"
                  className={`w-full rounded-full p-7 font-semibold ${
                     !selectedTask.active
                       ? "bg-gray-500 text-gray-300 cursor-not-allowed" // Style for inactive task
                       : canCheckIn
                         ? `bg-neutral-200 text-black ${getRankColor(selectedTask.rank)} hover:opacity-90` // Style for can check-in (active)
                         : "bg-neutral-800 text-white cursor-not-allowed" // Style for already checked-in (active)
                   }`}
                 >
                   {!selectedTask.active ? (
                     <>
                       <CheckCircle className="mr-2 h-5 w-5" /> Not Active Task
                     </>
                   ) : canCheckIn ? (
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

              {/* Recovery Tokens Display - From File 2, adapted */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-amber-500" />
                <span>Recovery Tokens: {selectedTask.recoveryTokens}</span>
              </div>

              {/* Recovery Option - From File 2, adapted */}
              {recoveryAvailable && (
                <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 rounded-md p-3 mx-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm">
                      Recover previous {selectedTask.previousStreak}-day streak?
                      <span className="font-medium"> ({getRecoveryTimeLeft(selectedTask)} hours left)</span>
                    </p>
                    <Button
                      onClick={handleRecoveryAttempt}
                      variant="outline"
                      className="border-amber-500  text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
                    >
                      <Undo2 className="mr-2 h-4 w-4" /> Use Recovery Token (Cost: 1)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Footer with Reset Button - From File 1, adapted */}
            <CardFooter className="flex justify-between px-4 pt-4">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetStreak(selectedTaskId, "Streak manually reset")}
               >
                 <AlertCircle className="mr-2 h-4 w-4" /> Reset Streak
               </Button>
               {selectedTask.count > 0 && (
                 <div className="text-sm text-muted-foreground">Keep the flame alive!</div>
               )}
            </CardFooter>
          </TabsContent>

          {/* Statistics Tab Content */}
          <TabsContent value="stats" className="space-y-4">
             {tasks.length > 1 && (
                <div className="px-4">
                 <TaskSelector
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    setSelectedTaskId={setSelectedTaskId}
                    setActiveTask={setActiveTask} // Allow changing active task from stats too
                 />
                </div>
              )}
              <CardContent className="space-y-6 pt-2">
                 {/* Task Statistics Component - From File 1 */}
                 <TaskStatistics
                   selectedTask={selectedTask}
                   statsPeriod={statsPeriod}
                   setStatsPeriod={setStatsPeriod}
                   getRankImage={getRankImage} // Pass File 2's function
                   getRankColor={getRankColor}   // Pass File 2's function
                 />
              </CardContent>
           </TabsContent>

          {/* Task Management Tab Content */}
          <TabsContent value="tasks">
              <CardContent className="space-y-4 pt-2">
                 {/* Task Creator/Editor/List Component - From File 1 */}
                 <TaskCreator
                tasks={tasks}
                onCreateTask={createNewTask}
                onEditTask={editTask}
                // onDeleteTask={deleteTask} // Use openDeleteTaskDialog to show confirmation
                openDeleteDialog={openDeleteTaskDialog}
                // Add any other props needed by TaskCreator, like setActiveTask if it has activation buttons
                setActiveTask={setActiveTask}
                selectedTaskId={selectedTaskId} // Pass selected ID for highlighting, etc.
                            />
              </CardContent>
           </TabsContent>

        </Tabs>
      </Card>

      {/* Dialogs and Modals */}

      {/* Recovery Dialog - From File 2, adapted */}
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recover Streak for "{selectedTask?.name || ''}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Use 1 recovery token to restore your previous {selectedTask?.previousStreak || 0}-day streak?
              You have {selectedTask?.recoveryTokens || 0} token{selectedTask?.recoveryTokens !== 1 ? "s" : ""} remaining.
              This action uses the token immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRecovery} className="bg-green-600 hover:bg-green-700">
              Confirm Recovery
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Dialog - From File 1 */}
      <AlertDialog open={showDeleteTaskDialog} onOpenChange={setShowDeleteTaskDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Task "{editingTask?.name || ''}"?</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure? All streak data for this task ({editingTask?.count || 0} days, {editingTask?.rank} rank)
               will be permanently lost. This cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => setEditingTask(null)}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => editingTask && deleteTask(editingTask.id)}
               className="bg-destructive hover:bg-destructive/90"
             >
               Delete Task Permanently
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>


      {/* Rank Up Congratulations Modal - From File 2 */}
      <AnimatePresence>
        {showCongratulations && selectedTask && ( // Ensure selectedTask exists for modal
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm p-4"
             onClick={() => setShowCongratulations(false)} // Close on background click
          >
             <motion.div
               initial={{ scale: 0.7, opacity: 0, y: 50 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.7, opacity: 0, y: 50 }}
               transition={{ type: "spring", stiffness: 400, damping: 25 }}
               className="bg-neutral-900 border border-neutral-700 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
               onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
             >
               {/* Optional: Add some background flair */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                  <div className={`h-64 w-64 rounded-full ${getRankColor(newRankAchieved)} absolute -top-16 -left-16 blur-3xl z-0 opacity-80`} />
                  <div className={`h-48 w-48 rounded-full ${getRankColor(newRankAchieved)} absolute -bottom-16 -right-16 blur-3xl z-0 opacity-60`} />
                </div>

               <motion.div
                 initial={{ scale: 3, opacity: 0, rotate: -30 }}
                 animate={{ scale: 1, opacity: 1, rotate: 0 }}
                 transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                 className="absolute top-4 right-4 text-yellow-400 z-20"
                >
                   <PartyPopper size={32} />
               </motion.div>


               <motion.h2
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.1 }}
                 className="text-3xl font-bold mb-2 text-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-300 z-10 relative"
               >
                 Rank Up!
               </motion.h2>

               <motion.p
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="text-lg mb-4 text-neutral-400 z-10 relative"
               >
                 Reached <span className={`${getRankColor(newRankAchieved)} bg-clip-text text-transparent font-semibold`}>{newRankAchieved}</span> on "{selectedTask.name}"!
               </motion.p>

               <motion.div
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                 className="mb-6 relative flex justify-center z-10"
               >
                 <Image
                   src={getRankImage(newRankAchieved)}
                   alt={`${newRankAchieved} Rank Badge`}
                   width={160}
                   height={160}
                   className="h-40 w-40 object-cover rounded-2xl shadow-lg pointer-events-none border-2 border-neutral-600"
                 />
               </motion.div>

               <motion.p
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="text-neutral-300 mb-6 z-10 relative"
               >
                 Amazing progress! Keep the momentum going!
               </motion.p>

               <motion.div
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.5 }}
                 className="z-10 relative"
               >
                 <Button
                   onClick={() => setShowCongratulations(false)}
                   className={`w-full py-3 ${getRankColor(newRankAchieved)} hover:opacity-90 text-black font-bold rounded-full transition-all duration-300 ease-out shadow-lg`}
                 >
                   <Trophy className="mr-2 h-4 w-4" /> Awesome!
                 </Button>
               </motion.div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}