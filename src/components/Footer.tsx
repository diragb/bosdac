// Packages:
import React from 'react'

// Functions:
const Footer = () => (
  <div className='absolute z-[1000] bottom-0 left-0 flex justify-between items-center w-screen h-10 px-3 bg-zinc-800 text-white text-xs md:text-base'>
    <div className='flex justify-center items-center gap-2.5'>
      <div>Images from <a className='font-semibold hover:underline' href='https://mosdac.gov.in/live/index_one.php?url_name=india' target='_blank'>MOSDAC Live</a> @ <a className='font-semibold hover:underline' href='https://www.isro.gov.in/' target='_blank'>ISRO</a></div>
      <div className='w-5 h-5 bg-center bg-cover bg-no-repeat' style={{ backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Indian_Space_Research_Organisation_Logo.svg/794px-Indian_Space_Research_Organisation_Logo.svg.png)' }} />
    </div>

    <a className='font-semibold hover:underline' href='https://diragb.dev/blog/gremlin' target='_blank'>
      Read More
    </a>
  </div>
)

// Exports:
export default Footer
