'use client'

import { useState, useEffect } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from 'react-hot-toast'
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { getAvailableRewards, getUserByEmail } from "../../utils/db/actions"

// Importing Inter font from Google Fonts
const inter = Inter({ subsets: ['latin'] })

// Root layout for the application
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // State to control sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // State to store total earnings of the user
  const [totalEarnings, setTotalEarnings] = useState(0)

  /**
   * Fetches the total earnings of a user when the layout first loads.
   * - Gets userEmail from localStorage.
   * - Fetches user details by email from DB.
   * - Fetches available rewards for that user.
   * - Updates state with the earnings.
   */
  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        // Retrieve user email from local storage
        const userEmail = localStorage.getItem('userEmail')

        if (userEmail) {
          // Fetch user details using email
          const user = await getUserByEmail(userEmail)
          console.log('user from layout', user);
          
          if (user) {
            // Fetch rewards/earnings for the user
            const availableRewards = await getAvailableRewards(user.id) as any
            console.log('availableRewards from layout', availableRewards);

            // Update state with earnings
            setTotalEarnings(availableRewards)
          }
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    fetchTotalEarnings()
  }, [])

  /**
   * Renders the application layout
   * - Header at top
   * - Sidebar on the left
   * - Main content area for children
   * - Toast notifications for alerts
   */
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen from-green-400 p-4 shadow-lg flex flex-col">
          
          {/* Header with menu toggle & earnings */}
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
            totalEarnings={totalEarnings} 
          />

          <div className="flex flex-1">
            {/* Sidebar (collapsible) */}
            <Sidebar open={sidebarOpen} />

            {/* Main content area */}
            <main className="flex-1 p-2 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
              {children}
            </main>
          </div>
        </div>

        {/* Toast notifications */}
        <Toaster />
      </body>
    </html>
  )
}
