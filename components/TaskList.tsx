"use client"

import type React from "react"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { useTask } from "@/contexts/TaskContext"
import TaskItem from "@/components/TaskItem"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"

export default function TaskList() {
  const { tasks, categories, reorderTasks } = useTask()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")

  const filteredTasks = tasks.filter((task) => {
    const categoryMatch = selectedCategory === "all" || task.category_id?.toString() === selectedCategory
    const priorityMatch = selectedPriority === "all" || task.priority === selectedPriority
    return categoryMatch && priorityMatch
  })

  const overdueTasks = filteredTasks.filter((task) => task.is_overdue)
  const dueSoonTasks = filteredTasks.filter((task) => task.is_due_soon && !task.is_overdue)
  const regularTasks = filteredTasks.filter((task) => !task.is_overdue && !task.is_due_soon)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(filteredTasks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const taskOrders = items.map((task, index) => ({
      id: task.id,
      order_index: index,
    }))

    reorderTasks(taskOrders)
  }

  const TaskSection = ({
    title,
    tasks,
    icon,
    color,
  }: { title: string; tasks: any[]; icon: React.ReactNode; color: string }) => {
    if (tasks.length === 0) return null

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <span className={`mr-2 ${color}`}>{icon}</span>
            {title}
            <Badge variant="secondary" className="ml-2">
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="moderate">Moderate Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TaskSection
        title="Overdue Tasks"
        tasks={overdueTasks}
        icon={<AlertTriangle className="h-5 w-5" />}
        color="text-red-600"
      />

      <TaskSection title="Due Soon" tasks={dueSoonTasks} icon={<Clock className="h-5 w-5" />} color="text-orange-600" />

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="regular-tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    Other Tasks
                    <Badge variant="secondary" className="ml-2">
                      {regularTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {regularTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? "opacity-50" : ""}`}
                          >
                            <TaskItem task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
