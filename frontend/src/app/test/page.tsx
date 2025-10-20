'use client';

export default function TestPage() {
  console.log('Test page loaded!');
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-600">TEST PAGE</h1>
      <p className="mt-4">If you can see this styled, React and Tailwind are working!</p>
      <button 
        onClick={() => alert('JavaScript is working!')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Click me to test JS
      </button>
    </div>
  );
}
