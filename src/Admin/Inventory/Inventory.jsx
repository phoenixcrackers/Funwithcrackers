import React from 'react'
import '../../App.css'
import Sidebar from '../Sidebar/Sidebar'

export default function Inventory() {
  return (
    <div>
        <Sidebar />
        <div className='flex justify-center'>
            <p className='font-bold text-3xl'>Add Items</p>
        </div>
    </div>
  )
}
