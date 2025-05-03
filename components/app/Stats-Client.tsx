"use client"

import { RANKS, Task } from "@/types/streak"
import { useState, useEffect } from "react"
import { TaskStatistics } from "./TaskStatistics"


export default function StatsClient() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [statsPeriod, setStatsPeriod] = useState<"week" | "month" | "all">(
    "month"
  )

  // Get the currently selected task
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ||
    tasks[0] || {
      id: "",
      name: "No tasks found",
      description: "",
      count: 0,
      lastCheckIn: null,
      rank: "Beginner",
      recoveryTokens: 0,
      previousStreak: 0,
      lastReset: null,
      createdAt: new Date().toISOString(),
      active: false,
      longestStreak: 0,
      totalCheckIns: 0,
      recoveryTokensUsed: 0,
      streakHistory: [],
      rankHistory: [],
      checkInDates: [],
    }

  // Helper functions for ranks
  const getRankImage = (rankName: string): string => {
    const rank = RANKS.find((r) => r.name === rankName)
    return rank?.img || "/images/HelloRank.jpg" // Fallback image
  }

  const getRankColor = (rankName: string): string => {
    const rank = RANKS.find((r) => r.name === rankName)
    return rank?.color || "bg-zinc-500" // Fallback color
  }

  // Load tasks from localStorage
  useEffect(() => {
    const loadTasksData = () => {
      const savedData = localStorage.getItem("streakTasks")

      if (savedData) {
        try {
          const parsedTasks = JSON.parse(savedData) as Task[]
          setTasks(parsedTasks)

          // Set the first active task as selected, or just the first task
          const activeTask = parsedTasks.find((task) => task.active)
          setSelectedTaskId(activeTask?.id || parsedTasks[0]?.id || "")
        } catch (error) {
          console.error("Error parsing tasks:", error)
        }
      }
    }

    loadTasksData()
  }, [])

  return (
    <div className="space-y-6">
      {tasks.length > 0 ? (
        <>
          {tasks.length > 1 && (
            <div className="mb-4">
              <label
                htmlFor="taskSelector"
                className="block text-sm font-medium mb-2"
              >
                Select Task
              </label>
              <select
                id="taskSelector"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name} {task.active ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <TaskStatistics
            selectedTask={selectedTask}
            statsPeriod={statsPeriod}
            setStatsPeriod={setStatsPeriod}
            getRankImage={getRankImage}
            getRankColor={getRankColor}
          />
        </>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-lg">
            No tasks found. Create a task to start tracking your stats!
          </p>
        </div>
      )}
    </div>
  )
}
