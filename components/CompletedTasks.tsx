"use client"

import { useTask } from "@/contexts/TaskContext"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Trash2, RotateCcw } from "lucide-react"
import { format } from "date-fns"

export default function CompletedTasks() {
  const { completedTasks, updateTask, deleteTask } = useTask()

  const handleUncomplete = (taskId: number) => {
    updateTask(taskId, { completed: false })
  }

  const handleDelete = (taskId: number) => {
    if (confirm("Are you sure you want to permanently delete this task?")) {
      deleteTask(taskId)
    }
  }

  if (completedTasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No completed tasks yet</h3>
          <p className="text-gray-500">Complete some tasks to see them here!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Completed Tasks</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {completedTasks.length} completed
        </Badge>
      </div>

      <div className="space-y-3">
        {completedTasks.map((task) => (
          <Card key={task.id} className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-medium text-gray-900 line-through">{task.title}</h3>
                  </div>

                  {task.description && <p className="text-sm text-gray-600 line-through mb-2">{task.description}</p>}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Completed: {format(new Date(task.completed_at!), "MMM dd, yyyy HH:mm")}</span>
                    {task.category && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: task.category.color }} />
                        {task.category.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUncomplete(task.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(task.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
