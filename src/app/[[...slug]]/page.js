import React from 'react';
import { ClientOnly } from "./client"

export function generateStaticParams() {
  // Add all static routes you want to export here
  return [
    { slug: [] }, // homepage
    { slug: ['about'] },
    { slug: ['contact'] },
    // Add more as needed
  ];
}
 
export default function Page() {
  return <ClientOnly /> 
}