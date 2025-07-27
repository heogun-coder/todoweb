"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import TaskList from "@/components/TaskList"
import CompletedTasks from "@/components/CompletedTasks"
import Calendar from "@/components/Calendar"
import Categories from "@/components/Categories"
import TaskForm from "@/components/TaskForm"
import { Plus, LogOut, CheckSquare } from "lucide-react"

export default function Dashboard() {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">TodoWeb</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}</span>
              <Button onClick={() => setShowTaskForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <TaskList />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <CompletedTasks />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <Calendar />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Categories />
          </TabsContent>
        </Tabs>
      </main>

      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  )
}
