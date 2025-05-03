"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Task } from "@/types/streak"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface TaskCreatorProps {
  tasks: Task[]
  onCreateTask: (name: string, description: string) => void
  onEditTask: (taskId: string, name: string, description: string) => void
  onDeleteTask?: (taskId: string) => void
  openDeleteDialog: any
  setActiveTask?: (taskId: string) => void
  selectedTaskId: string
}

export function TaskCreator({ tasks, onCreateTask, onEditTask, onDeleteTask, setActiveTask, selectedTaskId ,openDeleteDialog }: TaskCreatorProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task)
      setTaskName(task.name)
      setTaskDescription(task.description)
    } else {
      setEditingTask(null)
      setTaskName("")
      setTaskDescription("")
    }
    setShowDialog(true)
  }

  const handleSubmit = () => {
    if (!taskName.trim()) return

    if (editingTask) {
      onEditTask(editingTask.id, taskName.trim(), taskDescription.trim())
    } else {
      onCreateTask(taskName.trim(), taskDescription.trim())
    }

    setShowDialog(false)
    setTaskName("")
    setTaskDescription("")
    setEditingTask(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Tasks</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
              <DialogDescription>
                {editingTask
                  ? "Update your task details below."
                  : "Add a new task to track a different daily habit or goal."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input
                  id="task-name"
                  placeholder="e.g., Daily Exercise"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-description">Description (Optional)</Label>
                <Textarea
                  id="task-description"
                  placeholder="e.g., Complete a 15-minute workout every day"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>{editingTask ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onEdit={() => handleOpenDialog(task)}
            onDelete={() => openDeleteDialog(task)}
          />
        ))}
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  onEdit: () => void
  onDelete: () => void
}

function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const getRankImage = (rank: string) => {
    // Replace with your actual logic or import
    return ""
  }

  const getRankColor = (rank: string) => {
    // Replace with your actual logic or import
    return ""
  }

  return (
    <div
      className={`p-3 rounded-md flex justify-between items-center ${
        task.active ? "bg-primary/10 border border-primary/30" : "bg-muted/50 border border-border"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{task.name}</span>
          {task.active && (
            <Badge variant="outline" className="text-xs">
              Active
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <Badge className={`${getRankColor(task.rank)} text-xs`}>{task.rank}</Badge>
          </div>
        </div>
        {task.description && <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>}
        <div className="text-xs mt-1">
          Current streak: <span className="font-medium">{task.count}</span> days
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  )
}

