"use client"
import clsx from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost' }

export default function Button({ variant='primary', className, ...props }: Props){
  return (
    <button
      className={clsx('btn disabled:opacity-60', {
        'btn-primary': variant === 'primary',
        'btn-ghost': variant === 'ghost'
      }, className)}
      {...props}
    />
  )
}
