"use client"
import clsx from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost' }

export default function Button({ variant='primary', className, ...props }: Props){
  return (
    <button
      className={clsx('btn-smooth px-4 py-2 rounded-md font-semibold disabled:opacity-60', {
        'bg-primary text-black': variant === 'primary',
        'bg-transparent border border-gray-700 text-white': variant === 'ghost'
      }, className)}
      {...props}
    />
  )
}
