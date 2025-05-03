"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task } from "@/types/streak"

interface TaskSelectorProps {
  tasks: Task[]
  selectedTaskId: string
  setSelectedTaskId: (id: string) => void
  setActiveTask: (id: string) => void
}

export function TaskSelector({ tasks, selectedTaskId, setSelectedTaskId, setActiveTask }: TaskSelectorProps) {
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  return (
    <div className="space-y-4">
      <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a task" />
        </SelectTrigger>
        <SelectContent>
          {tasks.map((task) => (
            <SelectItem key={task.id} value={task.id}>
              <div className="flex items-center gap-2">
                <span>{task.name}</span>
                {task.active && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTask && !selectedTask.active && (
        <Button onClick={() => setActiveTask(selectedTaskId)} variant="outline" className="w-full">
          Make "{selectedTask.name}" Your Active Focus
        </Button>
      )}
    </div>
  )
}
