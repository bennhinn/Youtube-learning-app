import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/login') // or you can show a landing page
}