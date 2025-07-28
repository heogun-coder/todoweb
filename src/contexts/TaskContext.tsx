"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface Task {
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
  category: Category | null
  is_overdue: boolean
  is_due_soon: boolean
}

interface Category {
  id: number
  name: string
  color: string
  task_count?: number
}

interface TaskContextType {
  tasks: Task[]
  completedTasks: Task[]
  categories: Category[]
  loading: boolean
  fetchTasks: () => Promise<void>
  fetchCompletedTasks: () => Promise<void>
  fetchCategories: () => Promise<void>
  createTask: (task: Partial<Task>) => Promise<void>
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  reorderTasks: (taskOrders: { id: number; order_index: number }[]) => Promise<void>
  createCategory: (category: { name: string; color: string }) => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/tasks?completed=false", {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedTasks = async () => {
    try {
      const response = await fetch("/api/tasks?completed=true", {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setCompletedTasks(data)
      }
    } catch (error) {
      console.error("Error fetching completed tasks:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories", {
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const createTask = async (task: Partial<Task>) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(task),
      })
      if (response.ok) {
        await fetchTasks()
        await fetchCategories()
      }
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const updateTask = async (id: number, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })
      if (response.ok) {
        await fetchTasks()
        await fetchCompletedTasks()
        await fetchCategories()
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        await fetchTasks()
        await fetchCompletedTasks()
        await fetchCategories()
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const reorderTasks = async (taskOrders: { id: number; order_index: number }[]) => {
    try {
      const response = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ task_orders: taskOrders }),
      })
      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error("Error reordering tasks:", error)
    }
  }

  const createCategory = async (category: { name: string; color: string }) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(category),
      })
      if (response.ok) {
        await fetchCategories()
      }
    } catch (error) {
      console.error("Error creating category:", error)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchCompletedTasks()
    fetchCategories()
  }, [])

  return (
    <TaskContext.Provider
      value={{
        tasks,
        completedTasks,
        categories,
        loading,
        fetchTasks,
        fetchCompletedTasks,
        fetchCategories,
        createTask,
        updateTask,
        deleteTask,
        reorderTasks,
        createCategory,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTask() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider")
  }
  return context
}
