"use client"
import { RANKS, Task } from "@/types/streak"
import { format, differenceInDays, eachDayOfInterval, subDays } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RankName } from "./StreakTracker"


interface TaskStatisticsProps {
  selectedTask: Task
  statsPeriod: "week" | "month" | "all"
  setStatsPeriod: (period: "week" | "month" | "all") => void
  getRankImage: (rankName: RankName) => string 
  getRankColor: (rankName: RankName) => string 
}

export function TaskStatistics({
  selectedTask,
  statsPeriod,
  setStatsPeriod,
  getRankImage,
  getRankColor,
}: TaskStatisticsProps) {
  // Calculate completion rate
  const calculateCompletionRate = (task: Task) => {
    if (!task.createdAt) return 0

    const creationDate = new Date(task.createdAt)
    const today = new Date()
    const daysSinceCreation = Math.max(1, differenceInDays(today, creationDate) + 1)

    return Math.round((task.totalCheckIns / daysSinceCreation) * 100)
  }

  // Get streak history data for charts
  const getStreakHistoryData = (task: Task, period: "week" | "month" | "all" = "month") => {
    if (!task.streakHistory || task.streakHistory.length === 0) {
      return []
    }

    // Sort history by date
    const sortedHistory = [...task.streakHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    // Filter by period
    let filteredHistory = sortedHistory
    const today = new Date()

    if (period === "week") {
      const oneWeekAgo = subDays(today, 7)
      filteredHistory = sortedHistory.filter((entry) => new Date(entry.date) >= oneWeekAgo)
    } else if (period === "month") {
      const oneMonthAgo = new Date(today)
      oneMonthAgo.setMonth(today.getMonth() - 1)
      filteredHistory = sortedHistory.filter((entry) => new Date(entry.date) >= oneMonthAgo)
    }

    // Format for chart
    return filteredHistory.map((entry) => ({
      date: format(new Date(entry.date), "MMM dd"),
      streak: entry.value,
      action: entry.action,
    }))
  }

  // Get weekly check-in data
  const getWeeklyCheckInData = (task: Task) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const checkInCounts = Array(7).fill(0)

    // Count check-ins by day of week
    task.checkInDates.forEach((dateStr) => {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()
      checkInCounts[dayOfWeek]++
    })

    return daysOfWeek.map((day, index) => ({
      day: day.substring(0, 3), // Abbreviate day names
      checkIns: checkInCounts[index],
    }))
  }

  // Get calendar data for heatmap
  const getCalendarData = (task: Task) => {
    // Create a set of check-in dates for faster lookup
    const checkInDatesSet = new Set(
      task.checkInDates.map((date) => date.split("T")[0]), // YYYY-MM-DD format
    )

    // Get date range (last 4 weeks)
    const endDate = new Date()
    const startDate = subDays(endDate, 27) // 4 weeks = 28 days

    // Generate all dates in the range
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    // Create calendar data
    return dateRange.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      return {
        date: dateStr,
        value: checkInDatesSet.has(dateStr) ? 1 : 0,
        display: format(date, "MMM d"),
      }
    })
  }

  // Get rank history data
  const getRankHistoryData = (task: Task) => {
    if (!task.rankHistory || task.rankHistory.length === 0) {
      return []
    }

    return task.rankHistory.map((entry) => ({
      date: format(new Date(entry.date), "MMM dd"),
      from: entry.from,
      to: entry.to,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{selectedTask.count}</div>
          <div className="text-sm text-muted-foreground">Current Streak</div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{selectedTask.longestStreak}</div>
          <div className="text-sm text-muted-foreground">Longest Streak</div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{selectedTask.totalCheckIns}</div>
          <div className="text-sm text-muted-foreground">Total Check-ins</div>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold">{calculateCompletionRate(selectedTask)}%</div>
          <div className="text-sm text-muted-foreground">Completion Rate</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Streak History</h3>
          <Select value={statsPeriod} onValueChange={(value: "week" | "month" | "all") => setStatsPeriod(value)}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-muted/30 p-4 rounded-lg h-64">
          {selectedTask.streakHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={getStreakHistoryData(selectedTask, statsPeriod)}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip
                  formatter={(value, name) => [value, name === "streak" ? "Streak" : name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="streak"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No streak history available yet
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Weekly Check-in Pattern</h3>
        <div className="bg-muted/30 p-4 rounded-lg h-64">
          {selectedTask.checkInDates.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getWeeklyCheckInData(selectedTask)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip formatter={(value) => [`${value} check-ins`, "Check-ins"]} />
                <Bar dataKey="checkIns" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No check-in data available yet
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Activity Calendar</h3>
        <div className="bg-muted/30 p-4 rounded-lg overflow-x-auto">
          <div className="flex gap-1 min-w-[600px]">
            {getCalendarData(selectedTask).map((day, index) => (
              <div key={day.date} className="flex flex-col items-center">
                {index % 7 === 0 && (
                  <div className="text-xs text-muted-foreground mb-1">{day.display.split(" ")[0]}</div>
                )}
                <div
                  className={`w-6 h-6 rounded-sm ${
                    day.value ? "bg-green-500 dark:bg-green-700" : "bg-muted"
                  } ${format(new Date(), "yyyy-MM-dd") === day.date ? "ring-2 ring-primary" : ""}`}
                  title={`${day.display}: ${day.value ? "Checked in" : "No check-in"}`}
                />
                {index % 7 === 0 && (
                  <div className="text-xs text-muted-foreground mt-1">{day.display.split(" ")[1]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Recovery Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">{selectedTask.recoveryTokens}</div>
            <div className="text-sm text-muted-foreground">Available Tokens</div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">{selectedTask.recoveryTokensUsed}</div>
            <div className="text-sm text-muted-foreground">Tokens Used</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Rank Showcase</h3>
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            {RANKS.map((rank) => (
              <div
                key={rank.name}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  rank.name === selectedTask.rank ? "bg-primary/10 border border-primary/30" : ""
                }`}
              >
                <img src={getRankImage(rank.name as RankName) || "/placeholder.svg"} alt={rank.name} className="w-12 h-12" />
                <span className="text-xs font-medium mt-1">{rank.name}</span>
                <span className="text-xs text-muted-foreground">{rank.threshold}+ days</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedTask.rankHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Rank Progression</h3>
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="space-y-2">
              {getRankHistoryData(selectedTask).map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">{entry.date}:</div>
                  <div className="flex items-center gap-1">
                    <img src={getRankImage(entry.from as RankName) || "/placeholder.svg"} alt={entry.from} className="w-5 h-5" />
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getRankColor(entry.from as RankName)} text-white`}>
                      {entry.from}
                    </span>
                    <span>→</span>
                    <img src={getRankImage(entry.to as RankName) || "/placeholder.svg"} alt={entry.to} className="w-5 h-5" />
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getRankColor(entry.to as RankName)} text-white`}>
                      {entry.to}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
