import React from 'react'
import Sidebar from '../Sidebar/Sidebar'

export default function List() {
  return (
    <div>
        <Sidebar />
        <div className='flex justify-center'>
            <p className='font-bold text-3xl'>List Products to User</p>
        </div>
    </div>
  )
}
