export function Footer() {
  return (
    <footer className="border-t border-gray-800/50 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} RecoverySky</p>
        </div>
      </div>
    </footer>
  );
}
