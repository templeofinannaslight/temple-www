export function Footer() {
  return (
    <footer className="border-t-2 border-neon shadow-[0_-2px_30px_#ff2d9570] bg-accent/40 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} RecoverySky</p>
        </div>
      </div>
    </footer>
  );
}
