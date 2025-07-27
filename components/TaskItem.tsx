"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useTask } from "@/contexts/TaskContext"
import TaskForm from "@/components/TaskForm"
import { Calendar, Edit, Trash2, GripVertical, Repeat, StickyNote, AlertTriangle, Clock } from "lucide-react"
import { format } from "date-fns"

interface TaskItemProps {
  task: {
    id: number
    title: string
    description: string
    memo: string
    completed: boolean
    priority: "high" | "moderate" | "low"
    due_date: string | null
    created_at: string
    completed_at: string | null
    order_index: number
    is_repeatable: boolean
    repeat_type: string | null
    repeat_interval: number
    repeat_end_date: string | null
    category_id: number | null
    category: any
    is_overdue: boolean
    is_due_soon: boolean
  }
}

export default function TaskItem({ task }: TaskItemProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const { updateTask, deleteTask } = useTask()

  const handleToggleComplete = () => {
    updateTask(task.id, { completed: !task.completed })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(task.id)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "🔴"
      case "moderate":
        return "🟡"
      case "low":
        return "🟢"
      default:
        return "⚪"
    }
  }

  return (
    <>
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          task.is_overdue
            ? "border-red-300 bg-red-50"
            : task.is_due_soon
              ? "border-orange-300 bg-orange-50"
              : "border-gray-200"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex items-center mt-1">
              <GripVertical className="h-4 w-4 text-gray-400 mr-2 cursor-grab" />
              <Checkbox checked={task.completed} onCheckedChange={handleToggleComplete} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`text-sm mt-1 ${task.completed ? "line-through text-gray-400" : "text-gray-600"}`}>
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {task.is_overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {task.is_due_soon && !task.is_overdue && <Clock className="h-4 w-4 text-orange-500" />}
                  <Button variant="ghost" size="sm" onClick={() => setShowEditForm(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2 mt-3">
                <Badge className={getPriorityColor(task.priority)}>
                  {getPriorityIcon(task.priority)} {task.priority}
                </Badge>

                {task.category && (
                  <Badge variant="outline" className="border-gray-300">
                    <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: task.category.color }} />
                    {task.category.name}
                  </Badge>
                )}

                {task.due_date && (
                  <Badge variant="outline" className="border-gray-300">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(task.due_date), "MMM dd, yyyy")}
                  </Badge>
                )}

                {task.is_repeatable && (
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    <Repeat className="h-3 w-3 mr-1" />
                    {task.repeat_type}
                  </Badge>
                )}

                {task.memo && (
                  <Badge variant="outline" className="border-purple-300 text-purple-700">
                    <StickyNote className="h-3 w-3 mr-1" />
                    Memo
                  </Badge>
                )}
              </div>

              {task.memo && (
                <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
                  <strong>Memo:</strong> {task.memo}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showEditForm && <TaskForm task={task} onClose={() => setShowEditForm(false)} />}
    </>
  )
}
