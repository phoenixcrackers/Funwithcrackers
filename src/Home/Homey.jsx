import React from 'react'
import Nav from '../Component/Nav'
import "../App.css";

export default function Homey() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
        <Nav/>
        <div className="text-center p-6 max-w-2xl">
          <h1 className="text-4xl font-bold text-sky-800 mb-6">
            Welcome to Fun with Crackers 🎉
          </h1>
          <p className="text-lg text-sky-500 mb-4">
            We are close now due to lack of transportation 🚚. 
            Thank you for your understanding! 😊
          </p>
          <p className="text-lg text-sky-500 mb-4">
            We will meet you soon in the next Diwali! 🪔
          </p>
          <p className="text-xl font-bold text-red-500">
            We wish you all a safe and wonderful Diwali! 🎆✨
          </p>
        </div>
    </div>
  )
}