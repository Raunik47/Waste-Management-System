'use client'

import { useState,useEffect } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from 'react-hot-toast'
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}:{
    children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(0)

return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screenfrom-green-400 p-4 shadow-lg flex flex-col">
          {/* header*/}
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings} />

          <div className="flex flex-1">
            {/* <Sidebar open={sidebarOpen} /> */}

            <Sidebar open={sidebarOpen}/>

            <main className="flex-1 p-2 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}