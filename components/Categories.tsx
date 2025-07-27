"use client"

import type React from "react"

import { useState } from "react"
import { useTask } from "@/contexts/TaskContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Palette } from "lucide-react"

const PRESET_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#F43F5E",
]

export default function Categories() {
  const { categories, createCategory } = useTask()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCategory(formData)
    setFormData({ name: "", color: "#3B82F6" })
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Palette className="h-4 w-4 text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? "border-gray-800" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">Create Category</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.task_count || 0} active tasks</p>
                  </div>
                </div>
                <Badge variant="secondary">{category.task_count || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-12">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500 mb-4">Create categories to organize your tasks better</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
