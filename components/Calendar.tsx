"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"

interface CalendarTask {
  id: number
  title: string
  due_date: string
  priority: string
  completed: boolean
  category: any
  is_overdue: boolean
  is_due_soon: boolean
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchCalendarTasks()
  }, [currentDate])

  const fetchCalendarTasks = async () => {
    try {
      const token = localStorage.getItem("token")
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)

      const response = await fetch(
        `http://localhost:5000/api/calendar/tasks?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        setCalendarTasks(data)
      }
    } catch (error) {
      console.error("Error fetching calendar tasks:", error)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getTasksForDate = (date: Date) => {
    return calendarTasks.filter((task) => task.due_date && isSameDay(new Date(task.due_date), date))
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayTasks = getTasksForDate(day)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                      ${!isSameMonth(day, currentDate) ? "text-gray-300 bg-gray-50" : ""}
                      ${isSelected ? "bg-blue-100 border-blue-300" : "border-gray-200 hover:bg-gray-50"}
                      ${isToday ? "bg-blue-50 border-blue-200" : ""}
                    `}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className={`
                            text-xs p-1 rounded truncate
                            ${
                              task.is_overdue
                                ? "bg-red-100 text-red-800"
                                : task.is_due_soon
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          `}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && <div className="text-xs text-gray-500">+{dayTasks.length - 2} more</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>{selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              className={
                                task.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : task.priority === "moderate"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }
                            >
                              {task.priority}
                            </Badge>
                            {task.category && (
                              <Badge variant="outline">
                                <div
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: task.category.color }}
                                />
                                {task.category.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No tasks scheduled for this date</p>
              )
            ) : (
              <p className="text-gray-500 text-center py-8">Click on a date to view tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
