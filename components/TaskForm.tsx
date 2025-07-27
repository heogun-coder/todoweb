"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useTask } from "@/contexts/TaskContext"
import { X } from "lucide-react"

interface TaskFormProps {
  task?: any
  onClose: () => void
}

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const { createTask, updateTask, categories } = useTask()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    memo: "",
    priority: "moderate",
    due_date: "",
    category_id: "0", // Updated default value to be a non-empty string
    is_repeatable: false,
    repeat_type: "daily",
    repeat_interval: 1,
    repeat_end_date: "",
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        memo: task.memo || "",
        priority: task.priority || "moderate",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
        category_id: task.category_id?.toString() || "0", // Updated default value to be a non-empty string
        is_repeatable: task.is_repeatable || false,
        repeat_type: task.repeat_type || "daily",
        repeat_interval: task.repeat_interval || 1,
        repeat_end_date: task.repeat_end_date ? task.repeat_end_date.split("T")[0] : "",
      })
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const taskData = {
      ...formData,
      category_id: formData.category_id ? Number.parseInt(formData.category_id) : null,
      due_date: formData.due_date ? `${formData.due_date}T23:59:59` : null,
      repeat_end_date: formData.repeat_end_date ? `${formData.repeat_end_date}T23:59:59` : null,
    }

    if (task) {
      await updateTask(task.id, taskData)
    } else {
      await createTask(taskData)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{task ? "Edit Task" : "Create New Task"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="memo">Memo</Label>
              <Textarea
                id="memo"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={2}
                placeholder="Add a personal note or reminder..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High Priority</SelectItem>
                    <SelectItem value="moderate">🟡 Moderate Priority</SelectItem>
                    <SelectItem value="low">🟢 Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Category</SelectItem> {/* Updated value to be a non-empty string */}
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_repeatable"
                  checked={formData.is_repeatable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_repeatable: checked as boolean })}
                />
                <Label htmlFor="is_repeatable">Make this a repeatable task</Label>
              </div>

              {formData.is_repeatable && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="repeat_type">Repeat Type</Label>
                    <Select
                      value={formData.repeat_type}
                      onValueChange={(value) => setFormData({ ...formData, repeat_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="repeat_interval">Every</Label>
                    <Input
                      id="repeat_interval"
                      type="number"
                      min="1"
                      value={formData.repeat_interval}
                      onChange={(e) =>
                        setFormData({ ...formData, repeat_interval: Number.parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="repeat_end_date">Repeat Until (Optional)</Label>
                    <Input
                      id="repeat_end_date"
                      type="date"
                      value={formData.repeat_end_date}
                      onChange={(e) => setFormData({ ...formData, repeat_end_date: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{task ? "Update Task" : "Create Task"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
